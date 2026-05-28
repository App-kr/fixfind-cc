import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicClient, listAllSlugs } from '@/lib/supabase';
import { getProductImage } from '@/lib/product-images';
import { getServiceCenter } from '@/lib/service-centers';
import AdSlot from '@/components/AdSlot';
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

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listAllSlugs();
  return slugs
    .map((s) => {
      const [brand, model] = s.split('/');
      return brand && model ? { brand, model } : null;
    })
    .filter((x): x is Params => x !== null);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const { lang } = await searchParams;
  const slug = `${brand}/${model}`;
  const row = await fetchPart(slug);
  if (!row) return { title: `${brand} ${model} — Repair Guide` };

  const isKorean = lang === 'ko';

  const title = row.error_code
    ? `${row.brand} ${row.model} ${row.error_code} — Fix Guide`
    : `${row.brand} ${row.model} — Repair Guide`;

  const solutionText = isKorean && row.solution_ko ? row.solution_ko : (row.solution || '');
  const desc = solutionText.slice(0, 155);

  return {
    title,
    description: desc,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description: desc,
      type: 'article',
      images: row.affiliate_image ? [row.affiliate_image] : [],
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { brand, model } = await params;
  const { lang } = await searchParams;
  const isKorean = lang === 'ko';

  const slug = `${brand}/${model}`;
  const row = await fetchPart(slug);
  if (!row) notFound();

  const productImage = getProductImage(row.brand, slug);
  const serviceCenter = getServiceCenter(row.brand);

  const pageTitle = row.error_code
    ? `${row.brand} ${row.model} ${row.error_code} Fix`
    : `${row.brand} ${row.model} Repair Guide`;

  const solutionText = isKorean && row.solution_ko ? row.solution_ko : (row.solution || '');

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: pageTitle,
    description: (row.solution || '').slice(0, 300),
    supply: row.part_name ? [{ '@type': 'HowToSupply', name: row.part_name }] : [],
    step: [{ '@type': 'HowToStep', name: 'Fix the error', text: row.solution || '' }],
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
      ...(row.part_name
        ? [
            {
              '@type': 'Question',
              name: `What part do I need to fix ${row.brand} ${row.model}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `You need a ${row.part_name}. Generic aftermarket parts are available for $8–40.`,
              },
            },
          ]
        : []),
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* 브레드크럼 */}
      <nav className="mb-4 text-sm text-gray-500">
        <a href="/" className="hover:underline">
          Home
        </a>
        <span className="mx-2">›</span>
        <span className="capitalize">{row.brand}</span>
        <span className="mx-2">›</span>
        <span>{row.model}</span>
      </nav>

      {/* 언어 토글 */}
      <div className="mb-4 flex justify-end">
        <a
          href={isKorean ? `/${slug}` : `/${slug}?lang=ko`}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          {isKorean ? (
            <>
              <span>🇺🇸</span>
              <span>English</span>
            </>
          ) : (
            <>
              <span>🇰🇷</span>
              <span>한국어</span>
            </>
          )}
        </a>
      </div>

      {/* 제목 */}
      <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">
        {row.brand} {row.model}
        {row.error_code && (
          <span className="ml-3 inline-block rounded bg-red-600 px-3 py-1 text-xl text-white font-bold align-middle">
            {row.error_code}
          </span>
        )}
      </h1>

      {row.part_name && (
        <p className="text-base text-gray-600 mb-4">
          {isKorean ? '필요 부품: ' : 'Required part: '}
          <strong className="text-gray-900">{row.part_name}</strong>
        </p>
      )}

      {/* 제품 이미지 */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <img
          src={productImage}
          alt={`${row.brand} ${row.model}`}
          className="mx-auto max-h-64 w-full object-contain p-4"
          loading="lazy"
        />
      </div>

      <AdSlot slot="article-top" className="my-6 h-24" />

      {/* 빠른 요약 박스 */}
      {row.error_code && (
        <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 px-5 py-4">
          <p className="text-sm font-bold text-red-700 mb-1">
            {isKorean ? `에러: ${row.error_code}` : `⚡ Error: ${row.error_code}`}
          </p>
          <p className="text-gray-800 font-medium">
            {solutionText.split('.')[0]}.
          </p>
        </div>
      )}

      {/* 해결 방법 */}
      {solutionText && (
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-900 mb-3 pb-2 border-b-2 border-gray-900">
            {isKorean ? '수리 방법' : 'How to Fix'}
          </h2>
          <p className="text-gray-900 leading-relaxed" style={{ fontSize: '17px' }}>
            {solutionText}
          </p>
          {/* 영어 페이지에서 한국어 가이드도 제공 */}
          {!isKorean && row.solution_ko && (
            <details className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
              <summary className="cursor-pointer bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 select-none">
                🇰🇷 한국어 가이드 보기
              </summary>
              <div className="px-4 py-3 text-gray-800 leading-relaxed" style={{ fontSize: '16px' }}>
                {row.solution_ko}
              </div>
            </details>
          )}
        </section>
      )}

      {/* 부품 정보 */}
      <section className="mb-8 rounded-xl border-2 border-gray-900 bg-gray-50 p-6">
        <h2 className="text-lg font-black text-gray-900 mb-4">
          {isKorean ? '교체 부품' : '🛒 Replacement Part'}
        </h2>
        {row.affiliate_image && (
          <img
            src={row.affiliate_image}
            alt={row.part_name || 'replacement part'}
            className="mx-auto mb-4 max-h-48 rounded-lg object-contain"
          />
        )}
        {row.part_name && (
          <p className="text-gray-900 font-semibold mb-3">{row.part_name}</p>
        )}
        <AffiliateCTA
          href={row.affiliate_url}
          price={row.affiliate_price}
          partName={row.part_name || 'part'}
        />
      </section>

      {/* A/S 센터 정보 */}
      {serviceCenter && (
        <section className="mb-8">
          <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
            {isKorean ? 'A/S 센터 정보' : 'Service Center'}
          </h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
              <span className="text-white font-bold">{serviceCenter.brand}</span>
              <span className="text-gray-400 text-sm">
                {isKorean ? '공식 고객 지원' : 'Official Support'}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-gray-700 leading-relaxed text-sm">
                {isKorean ? serviceCenter.description_ko : serviceCenter.description_en}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {serviceCenter.phone_kr && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400 shrink-0">📞</span>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {isKorean ? '한국 고객센터' : 'Korea Support'}
                      </p>
                      <a
                        href={`tel:${serviceCenter.phone_kr.replace(/-/g, '')}`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {serviceCenter.phone_kr}
                      </a>
                      {serviceCenter.hours_kr && (
                        <p className="text-xs text-gray-500 mt-0.5">{serviceCenter.hours_kr}</p>
                      )}
                    </div>
                  </div>
                )}
                {serviceCenter.phone_us && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400 shrink-0">📞</span>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {isKorean ? '미국/글로벌 지원' : 'US / Global Support'}
                      </p>
                      <a
                        href={`tel:${serviceCenter.phone_us.replace(/-/g, '')}`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {serviceCenter.phone_us}
                      </a>
                      {serviceCenter.hours_en && (
                        <p className="text-xs text-gray-500 mt-0.5">{serviceCenter.hours_en}</p>
                      )}
                    </div>
                  </div>
                )}
                {serviceCenter.kakao && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400 shrink-0">💬</span>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">KakaoTalk</p>
                      <span className="font-semibold text-yellow-600">{serviceCenter.kakao}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-gray-400 shrink-0">🌐</span>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      {isKorean ? '온라인 접수' : 'Online Support'}
                    </p>
                    <a
                      href={serviceCenter.support_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline text-sm"
                    >
                      {isKorean ? '접수 페이지 열기 →' : 'Open Support Page →'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
          FAQ
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-bold text-gray-900 mb-2">
              {row.error_code
                ? isKorean
                  ? `${row.brand} ${row.model} ${row.error_code}는 무슨 에러인가요?`
                  : `What does ${row.error_code} mean on ${row.brand} ${row.model}?`
                : isKorean
                ? `${row.brand} ${row.model} 고장 수리 방법은?`
                : `How do I fix my ${row.brand} ${row.model}?`}
            </p>
            <p className="text-gray-700">{solutionText}</p>
          </div>
          {row.part_name && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="font-bold text-gray-900 mb-2">
                {isKorean ? '어떤 부품이 필요한가요?' : 'What replacement part do I need?'}
              </p>
              <p className="text-gray-700">
                {isKorean ? (
                  <>
                    <strong>{row.part_name}</strong> 이(가) 필요합니다. 알리익스프레스·쿠팡 등에서 호환
                    부품을 구매할 수 있으며, 모델에 따라 보통 1만 원~5만 원 선에서 해결됩니다.
                  </>
                ) : (
                  <>
                    You need a <strong>{row.part_name}</strong>. Generic aftermarket versions are
                    available on AliExpress and Amazon, typically for $8–40 depending on the model.
                  </>
                )}
              </p>
            </div>
          )}
          {serviceCenter && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="font-bold text-gray-900 mb-2">
                {isKorean
                  ? `${row.brand} 공식 A/S는 어떻게 받나요?`
                  : `Where is the official ${row.brand} service center?`}
              </p>
              <p className="text-gray-700">
                {isKorean ? serviceCenter.description_ko : serviceCenter.description_en}
                {serviceCenter.phone_kr && (
                  <> {isKorean ? `전화: ${serviceCenter.phone_kr}` : ''}</>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Facts */}
      <section className="mb-8 rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-900 px-4 py-2">
          <h3 className="text-sm font-bold text-white">
            {isKorean ? '제품 정보' : 'Quick Facts'}
          </h3>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-2 font-bold text-gray-900 bg-gray-50 w-1/3">
                {isKorean ? '브랜드' : 'Brand'}
              </td>
              <td className="px-4 py-2 text-gray-900">{row.brand}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-2 font-bold text-gray-900 bg-gray-50">
                {isKorean ? '모델' : 'Model'}
              </td>
              <td className="px-4 py-2 text-gray-900">{row.model}</td>
            </tr>
            {row.error_code && (
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2 font-bold text-gray-900 bg-gray-50">
                  {isKorean ? '에러 코드' : 'Error Code'}
                </td>
                <td className="px-4 py-2 font-mono font-bold text-red-600">{row.error_code}</td>
              </tr>
            )}
            {row.part_name && (
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2 font-bold text-gray-900 bg-gray-50">
                  {isKorean ? '필요 부품' : 'Part Needed'}
                </td>
                <td className="px-4 py-2 text-gray-900">{row.part_name}</td>
              </tr>
            )}
            {serviceCenter?.phone_kr && (
              <tr>
                <td className="px-4 py-2 font-bold text-gray-900 bg-gray-50">
                  {isKorean ? 'A/S 전화' : 'Support Phone'}
                </td>
                <td className="px-4 py-2 text-gray-900">{serviceCenter.phone_kr}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <AdSlot slot="article-bottom" className="my-6 h-24" />

      <footer className="text-xs text-gray-400 mt-4">
        {isKorean ? '최종 업데이트: ' : 'Last updated: '}
        {new Date(row.updated_at).toUTCString()}
      </footer>
    </main>
  );
}
