import { getPublicClient } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';

export const revalidate = 3600;

type Row = {
  id: number;
  brand: string;
  model: string;
  error_code: string | null;
  part_name: string | null;
  slug: string;
  updated_at: string;
};

async function getRecent(): Promise<Row[]> {
  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from('parts_db')
      .select('id, brand, model, error_code, part_name, slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100);
    return (data || []) as Row[];
  } catch {
    return [];
  }
}

const BRAND_ICONS: Record<string, string> = {
  iRobot: '🤖',
  Xiaomi: '📱',
  Ecovacs: '🔵',
  Neato: '🟠',
  Shark: '🦈',
  Eufy: '🟢',
  Roborock: '🔴',
  Samsung: '💠',
};

export default async function Home() {
  const rows = await getRecent();
  const byBrand = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byBrand.get(r.brand) || [];
    arr.push(r);
    byBrand.set(r.brand, arr);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">

      {/* 히어로 */}
      <section className="mb-10 border-b-2 border-gray-900 pb-8">
        <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
          Robot Vacuum Error Codes<br />& Repair Guides
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl">
          Find your error code, understand the cause, and fix it yourself.
          Covers <strong>iRobot Roomba, Xiaomi, Ecovacs, Neato, Roborock, Eufy, Shark</strong> and more.
        </p>
      </section>

      <AdSlot slot="home-top" className="mb-8 h-24" />

      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-500">
          Loading repair database...
        </div>
      ) : (
        <div>
          {[...byBrand.entries()].map(([brand, items]) => (
            <section key={brand} className="mb-10">
              <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b-2 border-gray-900">
                {BRAND_ICONS[brand] || '🔧'} {brand}
                <span className="text-base font-normal text-gray-500">({items.length} guides)</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((r) => (
                  <a
                    key={r.id}
                    href={`/${r.slug}`}
                    className="block rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <div className="font-bold text-gray-900 text-base">{r.model}</div>
                    {r.error_code && (
                      <div className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-sm font-bold text-red-700">
                        {r.error_code}
                      </div>
                    )}
                    {r.part_name && (
                      <div className="mt-2 text-sm text-gray-600 truncate">
                        Part: {r.part_name}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
