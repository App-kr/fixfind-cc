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

const BRAND_ORDER = ['iRobot', 'Roborock', 'Ecovacs', 'Xiaomi', 'Eufy', 'Shark', 'Neato', 'Samsung'];

export default async function Home() {
  const rows = await getRecent();
  const byBrand = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byBrand.get(r.brand) || [];
    arr.push(r);
    byBrand.set(r.brand, arr);
  }

  // Sort brands by preferred order, then alphabetically
  const sortedBrands = [...byBrand.keys()].sort((a, b) => {
    const ai = BRAND_ORDER.indexOf(a);
    const bi = BRAND_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <main>
      {/* Dark hero section */}
      <section
        style={{
          backgroundColor: '#1d1d1f',
          color: '#f5f5f7',
          padding: '100px 22px 80px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 'clamp(48px, 8vw, 80px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              color: '#f5f5f7',
              marginBottom: '20px',
            }}
          >
            Fix your robot vacuum.
          </h1>
          <p
            style={{
              fontSize: 'clamp(19px, 2.5vw, 24px)',
              fontWeight: 400,
              color: '#a1a1a6',
              letterSpacing: '0.01em',
              lineHeight: 1.5,
              marginBottom: '32px',
            }}
          >
            Error codes, causes, and step-by-step repair guides.
          </p>
          <p
            style={{
              fontSize: '15px',
              color: '#6e6e73',
              letterSpacing: '0.04em',
              fontWeight: 400,
            }}
          >
            Roomba &nbsp;&middot;&nbsp; Roborock &nbsp;&middot;&nbsp; Ecovacs &nbsp;&middot;&nbsp; Neato
            &nbsp;&middot;&nbsp; Eufy &nbsp;&middot;&nbsp; Shark &nbsp;&middot;&nbsp; Xiaomi
          </p>
        </div>
      </section>

      {/* Ad slot below hero */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '32px 22px 0' }}>
        <AdSlot slot="home-top" className="mb-8 h-24" />
      </div>

      {/* Brand sections */}
      {rows.length === 0 ? (
        <div
          style={{
            maxWidth: '980px',
            margin: '60px auto',
            padding: '80px 22px',
            textAlign: 'center',
            color: '#6e6e73',
            fontSize: '17px',
          }}
        >
          Loading repair database...
        </div>
      ) : (
        <div>
          {sortedBrands.map((brand, sectionIndex) => {
            const items = byBrand.get(brand)!;
            const isAlt = sectionIndex % 2 === 1;
            return (
              <section
                key={brand}
                style={{ backgroundColor: isAlt ? '#f5f5f7' : '#ffffff' }}
              >
                <div
                  style={{
                    maxWidth: '980px',
                    margin: '0 auto',
                    padding: '64px 22px',
                  }}
                >
                  {/* Brand header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                      marginBottom: '32px',
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#1d1d1f',
                        margin: 0,
                      }}
                    >
                      {brand}
                    </h2>
                    <span
                      style={{
                        fontSize: '14px',
                        color: '#6e6e73',
                        fontWeight: 400,
                      }}
                    >
                      {items.length} guides
                    </span>
                  </div>

                  {/* Cards grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {items.map((r) => (
                      <a
                        key={r.id}
                        href={`/${r.slug}`}
                        className="repair-card"
                        style={{
                          display: 'block',
                          backgroundColor: '#ffffff',
                          borderRadius: '18px',
                          padding: '24px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#1d1d1f',
                            lineHeight: 1.4,
                            marginBottom: r.error_code || r.part_name ? '10px' : 0,
                          }}
                        >
                          {r.model}
                        </div>
                        {r.error_code && (
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#fff2f2',
                              color: '#d70015',
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '20px',
                              letterSpacing: '0.02em',
                              marginBottom: r.part_name ? '8px' : 0,
                            }}
                          >
                            {r.error_code}
                          </span>
                        )}
                        {r.part_name && (
                          <div
                            style={{
                              fontSize: '13px',
                              color: '#6e6e73',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r.part_name}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Bottom CTA strip */}
      <section
        style={{
          backgroundColor: '#1d1d1f',
          padding: '80px 22px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#f5f5f7',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Can&apos;t find your error code?
          </h2>
          <p
            style={{
              fontSize: '17px',
              color: '#a1a1a6',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
          >
            Search by brand, model, or error code above.
            New repair guides are added daily.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: '#0071e3',
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: 500,
              padding: '12px 28px',
              borderRadius: '980px',
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Browse all brands
          </a>
        </div>
      </section>
    </main>
  );
}
