import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME_EXPORT } from '@/lib/admin-auth';
import { getAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 300;

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME_EXPORT)?.value ?? '';
  return verifySession(token) !== null;
}

async function generateKoreanSolution(brand: string, model: string, errorCode: string, solution: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const prompt = `당신은 로봇청소기 수리 전문 블로거입니다. 아래 영어 수리 가이드를 보고 자연스러운 한국어 수리 가이드를 작성해주세요.

제품 정보:
- 브랜드: ${brand}
- 모델: ${model}
- 에러/증상: ${errorCode || '일반 고장'}
- 영어 원문: ${solution}

작성 조건:
- 분량: 350~500자 (한국어)
- 말투: 네이버 블로그/티스토리 스타일 — 친근하고 실용적
- 구체적인 수리 단계와 원인 설명 포함
- 부품 가격은 한국 쿠팡/알리익스프레스 기준으로 환산 (1달러 ≈ 1,400원)
- 부품명은 한글로 설명 (예: "라이다 센서 모터", "배터리 팩")
- AI가 쓴 느낌 없이 실제 수리 경험자가 쓴 것처럼
- 에러 코드가 있으면 "[에러코드명] 에러는 보통..." 으로 시작
- 에러 코드가 없으면 "이 증상은 대부분..." 또는 "직접 열어보면..." 으로 시작
- JSON으로 감싸지 말고 순수 텍스트만 출력

한국어 수리 가이드:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 700 },
      }),
    }
  );
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty');
  return text.trim();
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const count = Math.min(parseInt(body.count ?? '5'), 20);
  const forceAll = body.force === true; // true = overwrite existing solution_ko too

  const supabase = getAdminClient();

  // Get articles that need Korean content
  let query = supabase
    .from('parts_db')
    .select('id, brand, model, error_code, solution')
    .order('id', { ascending: true })
    .limit(count);

  if (!forceAll) {
    query = query.is('solution_ko', null);
  }

  const { data: articles, error: fetchErr } = await query;
  if (fetchErr) {
    // If column doesn't exist yet, tell the user
    if (fetchErr.message?.includes('solution_ko')) {
      return NextResponse.json({
        error: 'solution_ko 컬럼이 없습니다. Supabase SQL 에디터에서 다음을 실행하세요:\nALTER TABLE parts_db ADD COLUMN IF NOT EXISTS solution_ko TEXT;',
        sql_needed: 'ALTER TABLE parts_db ADD COLUMN IF NOT EXISTS solution_ko TEXT;'
      }, { status: 400 });
    }
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ ok: true, message: '처리할 게시물이 없습니다', processed: 0 });
  }

  const results = { processed: 0, failed: 0, errors: [] as string[] };

  for (const article of articles) {
    try {
      const ko = await generateKoreanSolution(
        article.brand,
        article.model,
        article.error_code || '',
        article.solution || ''
      );

      const { error: updateErr } = await supabase
        .from('parts_db')
        .update({ solution_ko: ko, updated_at: new Date().toISOString() })
        .eq('id', article.id);

      if (updateErr) throw new Error(updateErr.message);
      results.processed++;
    } catch (e: any) {
      results.failed++;
      results.errors.push(`id=${article.id} ${article.brand} ${article.model}: ${e?.message}`);
    }
    // Small delay to avoid Gemini rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({ ok: true, ...results, total_checked: articles.length });
}
