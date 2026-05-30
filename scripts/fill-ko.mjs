/**
 * fill-ko.mjs — 전체 게시물 한글 수리 가이드 자동 생성 (독립 실행형)
 *
 * 사용법:
 *   node scripts/fill-ko.mjs            # 한글 없는 것만 채움
 *   node scripts/fill-ko.mjs --force    # 전체 덮어쓰기
 *   node scripts/fill-ko.mjs --dry      # Gemini 호출 없이 테스트
 *
 * 요구 사항: .env.local에 GEMINI_API_KEY + SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── env 로드 ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY   = env.GEMINI_API_KEY;
const FORCE = process.argv.includes('--force');
const DRY   = process.argv.includes('--dry');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : 0;
const SHORT = process.argv.includes('--short'); // 짧거나 잘린 가이드도 재생성
const MIN_LEN_ARG = process.argv.find(a => a.startsWith('--min='));
const MIN_LEN = MIN_LEN_ARG ? parseInt(MIN_LEN_ARG.split('=')[1], 10) : 320; // 이 길이 미만이면 재생성

// 무료 모델 우선순위 — 각 모델은 별도 일일 쿼터 버킷 → 429(일일한도) 시 다음 모델로 회전
// gemini-2.5-flash 는 이 키에서 일일 20건 한도라 마지막에 배치
const MODELS = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'];

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY 필요');
  process.exit(1);
}

const SB_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Prefer: 'return=minimal',
};

// ── Supabase helper ───────────────────────────────────────────────────────────
async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}

async function sbPatch(table, id, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: SB_HEADERS,
    body: JSON.stringify(data),
  });
  return r.ok;
}

// ── solution_ko 컬럼 존재 확인 ────────────────────────────────────────────────
async function ensureColumn() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/parts_db?select=solution_ko&limit=1`,
    { headers: SB_HEADERS }
  );
  if (r.ok) return true;

  console.log('\n⚠️  solution_ko 컬럼이 없습니다.');
  console.log('   Supabase SQL 에디터에서 아래 SQL을 실행하세요:');
  console.log('');
  console.log('   ALTER TABLE parts_db ADD COLUMN IF NOT EXISTS solution_ko TEXT;');
  console.log('');
  console.log('   URL: https://supabase.com/dashboard/project/lbfpsotkocnkszirkymv/sql/new');
  console.log('   실행 후 이 스크립트를 다시 실행하세요.\n');
  return false;
}

// ── Gemini Korean 생성 ────────────────────────────────────────────────────────
async function generateKo(brand, model, errorCode, solution) {
  if (DRY) return `[DRY] ${brand} ${model} 한글 가이드 테스트입니다. 실제 Gemini 없이 생성된 텍스트입니다.`;

  const errLabel = errorCode ? errorCode : '일반 고장 및 유지보수';

  const prompt = `당신은 로봇청소기 수리 전문 블로거입니다. 아래 영어 수리 가이드를 참고해서 자연스러운 한국어 수리 가이드를 작성하세요.

제품 정보:
- 브랜드: ${brand}
- 모델: ${model}
- 에러/증상: ${errLabel}
- 영어 원문: ${solution}

작성 조건:
- 분량: 350~500자 (한국어 기준)
- 말투: 네이버 블로그/티스토리 스타일 (친근하고 실용적, 경험자가 쓴 것처럼)
- 에러 원인 설명 + 단계별 수리 방법 + 필요 부품 명시
- 부품 가격은 쿠팡/알리익스프레스 기준 원화로 표기 (1달러 ≈ 1,400원)
- 부품명은 한글로 (예: "라이다 센서 모터", "메인 배터리 팩", "사이드 브러시 모듈")
- AI 번역 느낌 없이 자연스러운 한국어로
- 에러코드 있으면 "${errorCode ? errorCode + ' 에러는 주로' : '이 에러는 주로'}..." 로 시작
- 에러코드 없으면 "이 증상은 대부분..." 또는 "${brand} ${model}을(를) 직접 열어보면..." 으로 시작
- 순수 텍스트만 (JSON·마크다운 금지)

한국어 수리 가이드:`;

  let lastErr = '';
  for (const gModel of MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // thinkingBudget:0 → 내부 추론에 토큰 낭비 안 함 (빈응답 방지)
          generationConfig: { temperature: 0.85, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );

    if (res.ok) {
      const j = await res.json();
      const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
      lastErr = '빈 응답';
      continue;
    }

    const err = await res.text();
    lastErr = `${res.status} ${err.slice(0, 80)}`;
    // 429(일일/분당 한도)면 다음 모델 버킷으로 회전, 그 외 오류는 즉시 중단
    if (res.status === 429) continue;
    throw new Error(`Gemini ${lastErr}`);
  }
  throw new Error(`전 모델 소진: ${lastErr}`);
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
console.log('\n🇰🇷  fixfind 한글 수리 가이드 자동 생성 스크립트');
console.log(`   모드: ${FORCE ? '전체 덮어쓰기 (--force)' : '한글 없는 것만'}${DRY ? ' [DRY RUN]' : ''}\n`);

// 컬럼 확인
const colOk = await ensureColumn();
if (!colOk) process.exit(1);

// 처리할 게시물 조회
const selectCols = 'id,brand,model,error_code,solution,solution_ko';
const sbQuery = (FORCE || SHORT)
  ? `parts_db?select=${selectCols}&order=id.asc&limit=300`
  : `parts_db?select=${selectCols}&solution_ko=is.null&order=id.asc&limit=300`;

const articles = await sbGet(sbQuery);
if (!Array.isArray(articles)) {
  console.error('❌ Supabase 조회 실패:', JSON.stringify(articles).slice(0, 200));
  process.exit(1);
}

const base = articles.filter(a => {
  if (FORCE) return true;
  if (!a.solution_ko) return true;
  if (SHORT && a.solution_ko.length < MIN_LEN) return true; // 잘린 가이드 재생성
  return false;
});
const todo = LIMIT > 0 ? base.slice(0, LIMIT) : base;

console.log(`전체 조회: ${articles.length}개 / 처리 예정: ${todo.length}개${LIMIT > 0 ? ` (--limit=${LIMIT})` : ''}\n`);

if (todo.length === 0) {
  console.log('✅ 모든 게시물에 이미 한글 가이드가 있습니다!');
  process.exit(0);
}

let done = 0, failed = 0;
const DELAY_MS = DRY ? 50 : 6500; // gemini-2.5-flash 무료 10 RPM → 6.5초 간격

for (const article of todo) {
  const label = `[ID ${String(article.id).padStart(3)}] ${article.brand} ${article.model}`;
  process.stdout.write(`  ${label}... `);

  try {
    const ko = await generateKo(
      article.brand,
      article.model,
      article.error_code || '',
      article.solution || ''
    );

    if (!DRY) {
      const ok = await sbPatch('parts_db', article.id, {
        solution_ko: ko,
        updated_at: new Date().toISOString(),
      });
      if (!ok) throw new Error('Supabase PATCH 실패');
    }

    console.log(`✅ ${ko.length}자`);
    done++;
  } catch (e) {
    console.log(`❌ ${e.message}`);
    failed++;
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 완료: ${done}개 성공 | ${failed}개 실패 | 전체 ${todo.length}개`);
if (!DRY && done > 0) {
  console.log('🌐 https://fixfind.cc 에서 한글 가이드를 확인하세요!');
}
