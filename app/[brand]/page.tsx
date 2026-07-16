import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicClient } from '@/lib/supabase';

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc').replace(/\/$/, '');

type Params = { brand: string };

type Row = {
  id: number;
  brand: string;
  model: string;
  error_code: string | null;
  part_name: string | null;
  slug: string;
};

async function fetchBrandRows(brandSeg: string): Promise<Row[]> {
  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from('parts_db')
      .select('id, brand, model, error_code, part_name, slug')
      .ilike('slug', `${brandSeg}/%`)
      .order('model', { ascending: true })
      .limit(500);
    return (data || []) as Row[];
  } catch {
    return [];
  }
}

/** 브랜드 표시명 (DB brand 컬럼 우선, 없으면 세그먼트 캐피탈라이즈) */
function displayBrand(rows: Row[], seg: string): string {
  return rows[0]?.brand || seg.charAt(0).toUpperCase() + seg.slice(1);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand } = await params;
  const rows = await fetchBrandRows(brand);
  const name = displayBrand(rows, brand);
  const title = `${name} 로봇청소기 수리 가이드 — 에러코드·부품 교체`;
  const desc = `${name} 로봇청소기 에러코드 해석과 단계별 수리 방법 ${rows.length}개. 원인 분석, 교체 부품, 공식 A/S 정보까지 한 곳에서.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/${brand}` },
    openGraph: { title, description: desc, type: 'website' },
  };
}

export default async function BrandHub({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const rows = await fetchBrandRows(brand);
  if (rows.length === 0) notFound();

  const name = displayBrand(rows, brand);

  // 모델별 그룹
  const byModel = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byModel.get(r.model) || [];
    arr.push(r);
    byModel.set(r.model, arr);
  }
  const models = [...byModel.keys()].sort((a, b) => a.localeCompare(b));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: name, item: `${SITE_URL}/${brand}` },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name} 로봇청소기 수리 가이드`,
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 100).map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${r.slug}`,
      name: `${r.model}${r.error_code ? ` ${r.error_code}` : ''}`,
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500 flex items-center gap-1">
        <a href="/" className="hover:underline">홈</a>
        <span>›</span>
        <span className="text-gray-700 font-medium">{name}</span>
      </nav>

      {/* H1 — 키워드형 */}
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-3">
        {name} 로봇청소기 수리 가이드
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        {name} 로봇청소기의 에러코드 해석, 원인 분석, 단계별 수리 방법과 교체 부품 정보를 정리했습니다.
        총 <strong>{rows.length}개</strong>의 수리 가이드가 있습니다. 아래에서 증상·에러코드를 선택하세요.
      </p>

      {/* 모델별 목록 */}
      <div className="space-y-8">
        {models.map((model) => {
          const items = byModel.get(model)!;
          return (
            <section key={model}>
              <h2 className="text-xl font-black text-gray-900 mb-3 pb-2 border-b-2 border-gray-900">
                {name} {model}
                <span className="ml-2 text-sm font-normal text-gray-500">{items.length}개 가이드</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((r) => (
                  <a
                    key={r.id}
                    href={`/${r.slug}`}
                    className="block rounded-xl border border-gray-200 p-4 hover:border-gray-900 hover:shadow-sm transition"
                  >
                    <div className="font-semibold text-gray-900">
                      {r.model}
                      {r.error_code && (
                        <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 align-middle">
                          {r.error_code}
                        </span>
                      )}
                    </div>
                    {r.part_name && <div className="mt-1 text-sm text-gray-500 truncate">{r.part_name}</div>}
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100">
        <a href="/" className="text-sm text-blue-600 hover:underline">← 전체 브랜드 보기</a>
      </div>
    </main>
  );
}
