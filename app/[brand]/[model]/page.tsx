import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicClient, listAllSlugs } from '@/lib/supabase';
import { getProductImage, getGalleryImages } from '@/lib/product-images';
import { getServiceCenter } from '@/lib/service-centers';
import AffiliateCTA from '@/components/AffiliateCTA';

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc').replace(/\/$/, '');

type Params = { brand: string; model: string };

type Row = {
  id: number;
  brand: string;
  model: string;
  error_code: string | null;
  solution: string | null;
  solution_ko: string | null;
  part_name: string | null;
  affiliate_url: string | null;
  affiliate_price: number | null;
  affiliate_image: string | null;
  slug: string;
  updated_at: string;
};

type RelatedRow = {
  id: number;
  model: string;
  error_code: string | null;
  slug: string;
};

/**
 * SEO 중요: DB 에러와 "행 없음"을 반드시 구분한다.
 * 에러까지 null 로 뭉개면 notFound() → 404 가 되어, Supabase 일시장애 때
 * 전 페이지가 404 로 응답하고 구글이 색인에서 URL 을 제거해버린다.
 * 에러는 throw → 500 이어야 구글이 재시도한다.
 */
async function fetchPart(slug: string): Promise<Row | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('parts_db')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`fetchPart failed for ${slug}: ${error.message}`);
  return (data as Row) || null;
}

/** 같은 브랜드의 다른 수리 가이드 (내부링크용) */
async function fetchRelated(brandSeg: string, currentSlug: string): Promise<RelatedRow[]> {
  // 관련링크는 부가 요소 → 실패해도 본문은 살린다 (여기서는 삼키는 게 맞음)
  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from('parts_db')
      .select('id, model, error_code, slug')
      .ilike('slug', `${brandSeg}/%`)
      .neq('slug', currentSlug)
      .limit(8);
    return (data || []) as RelatedRow[];
  } catch {
    return [];
  }
}

/** Split solution text into numbered repair steps */
function parseSteps(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

/** 한국어 본문을 문장 단위 단계로 분해 */
function parseStepsKo(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?。])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);
}

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listAllSlugs();
  return slugs
    .map(s => {
      const [brand, model] = s.split('/');
      return brand && model ? { brand, model } : null;
    })
    .filter((x): x is Params => x !== null);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const slug = `${brand}/${model}`;
  const row = await fetchPart(slug);
  if (!row) return { title: `${brand} ${model} 수리 가이드` };

  // 한국어 우선 타이틀 (구글/네이버 한국 검색 타깃)
  const title = row.error_code
    ? `${row.brand} ${row.model} ${row.error_code} 에러 수리방법 — 원인·해결`
    : `${row.brand} ${row.model} 수리 가이드 — 고장·부품 교체`;

  const koBody = row.solution_ko || row.solution || '';
  const desc = koBody.replace(/\s+/g, ' ').slice(0, 155);

  // SEO keywords — 사람들이 실제로 검색창에 치는 표현 (KO 우선 + EN)
  const kw = new Set<string>();
  const bm = `${row.brand} ${row.model}`;
  kw.add(bm);
  if (row.error_code) {
    kw.add(`${bm} ${row.error_code}`);
    kw.add(`${row.model} ${row.error_code}`);
    kw.add(`${row.model} ${row.error_code} 에러`);
    kw.add(`${row.model} ${row.error_code} 해결`);
    kw.add(`${bm} ${row.error_code} fix`);
  }
  kw.add(`${row.model} 수리`);
  kw.add(`${row.model} 고장`);
  kw.add(`${bm} 에러`);
  kw.add(`${row.brand} 로봇청소기 수리`);
  if (row.part_name) kw.add(row.part_name);

  return {
    title,
    description: desc,
    keywords: [...kw],
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description: desc,
      type: 'article',
      images: row.affiliate_image ? [row.affiliate_image] : [getProductImage(row.brand, slug)],
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { brand, model } = await params;
  const slug = `${brand}/${model}`;
  const row = await fetchPart(slug);
  if (!row) notFound();

  const productImage = getProductImage(row.brand, slug);
  const galleryImages = getGalleryImages(row.brand, slug);
  const serviceCenter = getServiceCenter(row.brand);
  const enSteps = parseSteps(row.solution || '');
  const hasKorean = !!row.solution_ko;
  const koStepsRaw = hasKorean ? parseStepsKo(row.solution_ko!) : enSteps;
  // 문장 분해 실패(마침표 없는 한 덩어리) 시 빈 <ol>/빈 HowTo.step 방지
  const koSteps = koStepsRaw.length > 0
    ? koStepsRaw
    : [row.solution_ko || row.solution || ''].filter(Boolean);
  const related = await fetchRelated(brand, slug);

  // ── 구조화 데이터 ─────────────────────────────────────────
  // 주: FAQPage 는 2026-05 구글 리치결과에서 폐지 + 본문과 답변 불일치는
  //     가이드라인 위반 리스크만 남으므로 제거. Article/Breadcrumb 중심으로 유지.
  const howToSchema = koSteps.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: row.error_code
      ? `${row.brand} ${row.model} ${row.error_code} 수리방법`
      : `${row.brand} ${row.model} 수리 가이드`,
    description: (row.solution_ko || row.solution || '').slice(0, 300),
    inLanguage: 'ko',
    ...(row.part_name ? { supply: [{ '@type': 'HowToSupply', name: row.part_name }] } : {}),
    step: koSteps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: `${i + 1}단계`, text: s })),
  } : null;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: row.error_code
      ? `${row.brand} ${row.model} ${row.error_code} 에러 수리방법`
      : `${row.brand} ${row.model} 수리 가이드`,
    description: (row.solution_ko || row.solution || '').slice(0, 300),
    inLanguage: 'ko',
    dateModified: row.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/${slug}` },
    publisher: { '@type': 'Organization', name: 'fixfind', url: SITE_URL },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: row.brand, item: `${SITE_URL}/${brand}` },
      { '@type': 'ListItem', position: 3, name: `${row.model}${row.error_code ? ` ${row.error_code}` : ''}`, item: `${SITE_URL}/${slug}` },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {howToSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb — 브랜드는 허브로 연결 */}
      <nav className="mb-3 text-sm text-gray-500 flex items-center gap-1">
        <a href="/" className="hover:underline">홈</a>
        <span>›</span>
        <a href={`/${brand}`} className="hover:underline">{row.brand}</a>
        <span>›</span>
        <span className="text-gray-700 font-medium">{row.model}</span>
      </nav>

      {/* H1 */}
      <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">
        {row.brand} {row.model}
        {row.error_code && (
          <span className="ml-3 inline-block rounded-lg bg-red-600 px-3 py-1 text-xl text-white font-bold align-middle">
            {row.error_code}
          </span>
        )}
        <span className="block text-lg font-bold text-gray-500 mt-2">
          {row.error_code ? `${row.error_code} 에러 원인과 수리 방법` : '고장 원인과 수리 방법'}
        </span>
      </h1>

      {/* ── 제품 정보 박스 ───────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border-2 border-gray-900 overflow-hidden shadow-sm">
        <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
          <span className="text-white font-bold text-sm tracking-wide">제품 정보</span>
          <span className="text-gray-400 text-xs">{row.brand}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 bg-white">
          <div className="px-4 py-3">
            <div className="text-xs text-gray-500 mb-1">브랜드</div>
            <div className="font-bold text-gray-900">{row.brand}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs text-gray-500 mb-1">모델</div>
            <div className="font-bold text-gray-900">{row.model}</div>
          </div>
          {row.error_code && (
            <div className="px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">에러코드</div>
              <div className="font-mono font-bold text-red-600">{row.error_code}</div>
            </div>
          )}
          {row.part_name && (
            <div className="px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">필요 부품</div>
              <div className="font-semibold text-gray-900 text-sm">{row.part_name}</div>
            </div>
          )}
          {serviceCenter?.phone_kr && (
            <div className="px-4 py-3 col-span-2 sm:col-span-1">
              <div className="text-xs text-gray-500 mb-1">A/S 전화</div>
              <a href={`tel:${serviceCenter.phone_kr.replace(/-/g, '')}`}
                 className="font-bold text-blue-700 hover:underline">
                {serviceCenter.phone_kr}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 제품 이미지 */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <img
          src={productImage}
          alt={`${row.brand} ${row.model} 로봇청소기`}
          className="w-full h-56 object-cover"
          loading="eager"
        />
      </div>

      {/* ══════════════ 한국어 (주력) ══════════════ */}
      {row.error_code && (
        <div className="mb-5 rounded-xl border-l-4 border-red-500 bg-red-50 px-5 py-4">
          <p className="text-sm font-bold text-red-700 mb-1">에러 코드: {row.error_code}</p>
          <p className="text-gray-800 font-medium leading-relaxed">
            {hasKorean
              ? row.solution_ko!.split(/[.。]/)[0] + '.'
              : `${row.brand} ${row.model}의 ${row.error_code} 에러 원인 및 단계별 수리 방법입니다.`}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-black text-gray-900 mb-1">
        {row.error_code ? `${row.model} ${row.error_code} 수리 방법` : `${row.model} 수리 방법`}
      </h2>
      <div className="mb-5 h-0.5 w-16 bg-gray-900 rounded" />

      <section className="mb-8">
        <ol className="space-y-3">
          {koSteps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-gray-900 leading-relaxed" style={{ fontSize: '16px', lineHeight: '1.9' }}>{step}</p>
            </li>
          ))}
        </ol>

        {/* 갤러리 */}
        {galleryImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {galleryImages.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                  src={img}
                  alt={`${row.brand} ${row.model} 수리 참고 이미지 ${i + 2}`}
                  className="w-full h-36 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 교체 부품 */}
      <section className="mb-10 rounded-2xl border-2 border-gray-900 bg-gray-50 p-6">
        <h2 className="text-base font-black text-gray-900 mb-3">🛒 교체 부품 구매</h2>
        {row.affiliate_image && (
          <img src={row.affiliate_image} alt={row.part_name || '교체 부품'}
               className="mx-auto mb-4 max-h-40 rounded-xl object-contain" />
        )}
        {row.part_name && <p className="text-gray-900 font-semibold mb-3 text-sm">{row.part_name}</p>}
        <AffiliateCTA href={row.affiliate_url} price={row.affiliate_price} partName={row.part_name || 'part'} searchKeyword={`${row.brand} ${row.model} ${row.part_name || ''}`} />
      </section>

      {/* 자주 묻는 질문 */}
      <section className="mb-10">
        <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">자주 묻는 질문</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="font-bold text-gray-900 mb-2 text-sm">
              {row.error_code
                ? `${row.brand} ${row.model} ${row.error_code}는 무슨 에러인가요?`
                : `${row.brand} ${row.model} 고장은 어떻게 수리하나요?`}
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              {koSteps[0] || row.solution_ko || row.solution}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="font-bold text-gray-900 mb-2 text-sm">직접 수리가 어려운가요?</p>
            <p className="text-gray-700 text-sm leading-relaxed">
              위 단계는 드라이버 등 기본 공구로 대부분 20~40분 안에 마칠 수 있습니다.
              분해가 부담스럽다면 아래 공식 A/S 센터로 접수하는 방법도 있습니다.
            </p>
          </div>
          {row.part_name && (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900 mb-2 text-sm">어떤 부품이 필요한가요?</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>{row.part_name}</strong>이(가) 필요합니다.
                알리익스프레스·쿠팡 등에서 호환 부품을 구매할 수 있으며,
                보통 1만 원~5만 원 선에서 해결됩니다.
              </p>
            </div>
          )}
          {serviceCenter && (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900 mb-2 text-sm">{row.brand} 공식 A/S는 어떻게 받나요?</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {serviceCenter.description_ko}
                {serviceCenter.phone_kr && <> 전화: <strong>{serviceCenter.phone_kr}</strong></>}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* A/S 센터 */}
      {serviceCenter && (
        <section className="mb-10">
          <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">A/S 센터 정보</h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
              <span className="text-white font-bold">{serviceCenter.brand}</span>
              <span className="text-gray-400 text-xs">공식 고객 지원</span>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-gray-700 text-sm leading-relaxed">{serviceCenter.description_ko}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {serviceCenter.phone_kr && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 shrink-0 mt-0.5">📞</span>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">한국 고객센터</p>
                      <a href={`tel:${serviceCenter.phone_kr.replace(/-/g,'')}`}
                         className="font-semibold text-gray-900 hover:underline">{serviceCenter.phone_kr}</a>
                      {serviceCenter.hours_kr && <p className="text-xs text-gray-500 mt-0.5">{serviceCenter.hours_kr}</p>}
                    </div>
                  </div>
                )}
                {serviceCenter.kakao && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 shrink-0 mt-0.5">💬</span>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">KakaoTalk</p>
                      <span className="font-semibold text-yellow-600">{serviceCenter.kakao}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 shrink-0 mt-0.5">🌐</span>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">온라인 접수</p>
                    <a href={serviceCenter.support_url} target="_blank" rel="noopener noreferrer"
                       className="font-semibold text-blue-600 hover:underline text-sm">
                      접수 페이지 열기 →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 관련 가이드 — 내부링크 (SEO 핵심) */}
      {related.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
            {row.brand} 다른 수리 가이드
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <a key={r.id} href={`/${r.slug}`}
                 className="block rounded-xl border border-gray-200 p-4 hover:border-gray-900 hover:shadow-sm transition">
                <span className="font-semibold text-gray-900">{r.model}</span>
                {r.error_code && (
                  <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 align-middle">
                    {r.error_code}
                  </span>
                )}
              </a>
            ))}
          </div>
          <div className="mt-4">
            <a href={`/${brand}`} className="text-sm text-blue-600 hover:underline">
              {row.brand} 수리 가이드 전체 보기 →
            </a>
          </div>
        </section>
      )}

      {/* ══════════════ English (secondary) ══════════════ */}
      {enSteps.length > 0 && (
        <section className="mb-10 rounded-2xl bg-gray-50 border border-gray-200 p-6">
          <div className="mb-3 flex items-center gap-2">
            <span>🇺🇸</span>
            <h2 className="text-base font-black text-gray-900">
              {row.error_code ? `${row.brand} ${row.model} ${row.error_code} — English Fix Guide` : `How to Fix ${row.brand} ${row.model}`}
            </h2>
          </div>
          <ol className="space-y-2">
            {enSteps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-700 leading-relaxed text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
        최종 업데이트: {new Date(row.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </footer>
    </main>
  );
}
