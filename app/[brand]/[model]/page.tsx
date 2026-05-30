import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicClient, listAllSlugs } from '@/lib/supabase';
import { getProductImage, getGalleryImages } from '@/lib/product-images';
import { getServiceCenter } from '@/lib/service-centers';
import AffiliateCTA from '@/components/AffiliateCTA';

export const revalidate = 3600;
export const dynamicParams = true;

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

async function fetchPart(slug: string): Promise<Row | null> {
  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from('parts_db')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();
    return (data as Row) || null;
  } catch {
    return null;
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
  if (!row) return { title: `${brand} ${model} — Repair Guide` };

  const title = row.error_code
    ? `${row.brand} ${row.model} ${row.error_code} — Fix Guide`
    : `${row.brand} ${row.model} — Repair Guide`;

  const desc = (row.solution || '').slice(0, 155);

  return {
    title,
    description: desc,
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

  // Admin mode: show ad slot outlines
  const cookieStore = await cookies();
  const isAdmin = !!cookieStore.get('ff_admin')?.value;

  const productImage = getProductImage(row.brand, slug);
  const galleryImages = getGalleryImages(row.brand, slug);
  const serviceCenter = getServiceCenter(row.brand);
  const enSteps = parseSteps(row.solution || '');
  const hasKorean = !!(row.solution_ko);

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: row.error_code
      ? `${row.brand} ${row.model} ${row.error_code} Fix`
      : `${row.brand} ${row.model} Repair Guide`,
    description: (row.solution || '').slice(0, 300),
    supply: row.part_name ? [{ '@type': 'HowToSupply', name: row.part_name }] : [],
    step: enSteps.map((s, i) => ({ '@type': 'HowToStep', name: `Step ${i + 1}`, text: s })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: row.error_code
          ? `What does ${row.brand} ${row.model} ${row.error_code} mean?`
          : `How do I fix my ${row.brand} ${row.model}?`,
        acceptedAnswer: { '@type': 'Answer', text: row.solution || '' },
      },
      ...(row.part_name ? [{
        '@type': 'Question',
        name: `What part do I need for ${row.brand} ${row.model}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You need a ${row.part_name}. Aftermarket parts cost roughly $8–40.`,
        },
      }] : []),
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Breadcrumb */}
      <nav className="mb-3 text-sm text-gray-500 flex items-center gap-1">
        <a href="/" className="hover:underline">홈</a>
        <span>›</span>
        <a href="/" className="hover:underline capitalize">{row.brand}</a>
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
      </h1>

      {/* ── QUICK FACTS BOX — TOP ───────────────────────────────── */}
      <div className="mb-8 rounded-2xl border-2 border-gray-900 overflow-hidden shadow-sm">
        <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
          <span className="text-white font-bold text-sm tracking-wide uppercase">제품 정보 / Product Info</span>
          <span className="text-gray-400 text-xs">{row.brand}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 bg-white">
          <div className="px-4 py-3">
            <div className="text-xs text-gray-500 mb-1">브랜드 / Brand</div>
            <div className="font-bold text-gray-900">{row.brand}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs text-gray-500 mb-1">모델 / Model</div>
            <div className="font-bold text-gray-900">{row.model}</div>
          </div>
          {row.error_code && (
            <div className="px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">에러코드 / Error</div>
              <div className="font-mono font-bold text-red-600">{row.error_code}</div>
            </div>
          )}
          {row.part_name && (
            <div className="px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">필요 부품 / Part</div>
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

      {/* ══════════════ ENGLISH SECTION ══════════════ */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-lg">🇺🇸</span>
        <h2 className="text-2xl font-black text-gray-900">
          {row.error_code ? `What is ${row.error_code}?` : `How to Fix ${row.brand} ${row.model}`}
        </h2>
      </div>
      <div className="mb-1 h-0.5 w-16 bg-gray-900 rounded" />

      {/* Error alert */}
      {row.error_code && row.solution && (
        <div className="mt-4 mb-5 rounded-xl border-l-4 border-red-500 bg-red-50 px-5 py-4">
          <p className="text-sm font-bold text-red-700 mb-1">⚡ Error: {row.error_code}</p>
          <p className="text-gray-800 font-medium leading-relaxed">
            {enSteps[0] || row.solution.slice(0, 160)}
          </p>
        </div>
      )}

      {/* Product image */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <img
          src={productImage}
          alt={`${row.brand} ${row.model} robot vacuum`}
          className="w-full h-56 object-cover"
          loading="eager"
        />
      </div>

      {/* Step-by-step repair */}
      {enSteps.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-black text-gray-900 mb-4">Step-by-Step Fix</h3>
          <ol className="space-y-3">
            {enSteps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-900 leading-relaxed" style={{ fontSize: '16px' }}>{step}</p>
              </li>
            ))}
          </ol>

          {/* Gallery thumbnails */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {galleryImages.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                  src={img}
                  alt={`${row.brand} ${row.model} repair guide image ${i + 2}`}
                  className="w-full h-36 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Replacement part */}
      <section className="mb-10 rounded-2xl border-2 border-gray-900 bg-gray-50 p-6">
        <h3 className="text-base font-black text-gray-900 mb-3">🛒 Replacement Part</h3>
        {row.affiliate_image && (
          <img src={row.affiliate_image} alt={row.part_name || 'part'}
               className="mx-auto mb-4 max-h-40 rounded-xl object-contain" />
        )}
        {row.part_name && <p className="text-gray-900 font-semibold mb-3 text-sm">{row.part_name}</p>}
        <AffiliateCTA href={row.affiliate_url} price={row.affiliate_price} partName={row.part_name || 'part'} searchKeyword={`${row.brand} ${row.model} ${row.part_name || ''}`} />
      </section>

      {/* Ad slot — admin visible only */}
      {isAdmin && (
        <div className="my-6 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 text-xs text-blue-500 font-semibold"
             style={{ minHeight: 80 }}>
          📢 Admin: Ad Slot — article-mid (배너 영역 / 일반 사용자에게는 숨김)
        </div>
      )}

      {/* ══════════════ KOREAN SECTION ══════════════ */}
      <div className="mt-10 mb-6 flex items-center gap-3">
        <span className="text-xl">🇰🇷</span>
        <h2 className="text-2xl font-black text-gray-900">한국어 수리 가이드</h2>
      </div>
      <div className="mb-6 h-0.5 w-16 bg-gray-900 rounded" />

      {/* Korean error summary */}
      {row.error_code && (
        <div className="mb-5 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-5 py-4">
          <p className="text-sm font-bold text-blue-700 mb-1">에러 코드: {row.error_code}</p>
          <p className="text-gray-800 font-medium leading-relaxed">
            {hasKorean
              ? (row.solution_ko!.split(/[.。]/)[0] + '.')
              : `${row.brand} ${row.model}의 ${row.error_code} 에러 원인 및 수리 방법입니다.`}
          </p>
        </div>
      )}

      {/* Korean solution */}
      <section className="mb-8 rounded-2xl bg-gray-50 border border-gray-200 p-6">
        <h3 className="text-lg font-black text-gray-900 mb-4">수리 방법</h3>
        {hasKorean ? (
          <p className="text-gray-900 leading-relaxed whitespace-pre-line" style={{ fontSize: '16px', lineHeight: '1.9' }}>
            {row.solution_ko}
          </p>
        ) : (
          /* 한국어 가이드 생성 전 — 영어 단계별 가이드를 번호 순으로 표시 */
          <ol className="space-y-3">
            {enSteps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-800 leading-relaxed" style={{ fontSize: '15px' }}>{step}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Korean FAQ */}
      <section className="mb-8">
        <h3 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">자주 묻는 질문</h3>
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="font-bold text-gray-900 mb-2 text-sm">
              {row.error_code
                ? `${row.brand} ${row.model} ${row.error_code}는 무슨 에러인가요?`
                : `${row.brand} ${row.model} 고장 수리 방법은?`}
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              {hasKorean ? row.solution_ko : row.solution}
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
          <h3 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">A/S 센터 정보</h3>
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
                {serviceCenter.phone_us && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 shrink-0 mt-0.5">📞</span>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">미국/글로벌 지원</p>
                      <a href={`tel:${serviceCenter.phone_us.replace(/-/g,'')}`}
                         className="font-semibold text-gray-900 hover:underline">{serviceCenter.phone_us}</a>
                      {serviceCenter.hours_en && <p className="text-xs text-gray-500 mt-0.5">{serviceCenter.hours_en}</p>}
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

      {/* Bottom ad — admin only */}
      {isAdmin && (
        <div className="my-6 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 text-xs text-blue-500 font-semibold"
             style={{ minHeight: 80 }}>
          📢 Admin: Ad Slot — article-bottom (배너 영역 / 일반 사용자에게는 숨김)
        </div>
      )}

      <footer className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
        최종 업데이트: {new Date(row.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </footer>
    </main>
  );
}
