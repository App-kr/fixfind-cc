import { getPublicClient } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';
import ScrollReveal from '@/components/ScrollReveal';

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
      .limit(200);
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

  const sortedBrands = [...byBrand.keys()].sort((a, b) => {
    const ai = BRAND_ORDER.indexOf(a);
    const bi = BRAND_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const totalArticles = rows.length;

  return (
    <main>
      {/* ── HERO — all white, giant black type ─────────────────────── */}
      <section
        style={{
          backgroundColor: '#ffffff',
          padding: 'clamp(80px, 14vw, 160px) 22px clamp(60px, 10vw, 120px)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Eyebrow */}
        <p
          className="hero-line hero-line-1"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#6e6e73',
            marginBottom: '24px',
          }}
        >
          수리 가이드 · 에러코드 · 교체 부품
        </p>

        {/* Main headline */}
        <h1
          className="hero-line hero-line-2"
          style={{
            fontSize: 'clamp(64px, 13vw, 148px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            color: '#1d1d1f',
            margin: '0 auto 28px',
            maxWidth: '960px',
          }}
        >
          Fix&nbsp;whatever.
        </h1>

        {/* Sub */}
        <p
          className="hero-line hero-line-3"
          style={{
            fontSize: 'clamp(17px, 2.2vw, 22px)',
            fontWeight: 400,
            color: '#6e6e73',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          로봇청소기 에러코드 해석부터 부품 교체까지 — 브랜드별 단계별 수리 가이드를 무료로 제공합니다.
        </p>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <ScrollReveal>
        <section
          style={{
            borderTop: '0.5px solid #e5e5ea',
            borderBottom: '0.5px solid #e5e5ea',
            backgroundColor: '#f5f5f7',
            padding: '28px 22px',
          }}
        >
          <div
            style={{
              maxWidth: '980px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(24px, 6vw, 72px)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { num: `${totalArticles}+`, label: '수리 가이드' },
              { num: '8', label: '브랜드 지원' },
              { num: 'Daily', label: '매일 추가' },
              { num: '₩0', label: '직접 수리 비용' },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'clamp(28px, 4vw, 40px)',
                    fontWeight: 700,
                    color: '#1d1d1f',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  {num}
                </div>
                <div style={{ fontSize: '13px', color: '#6e6e73', fontWeight: 400 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <AdSlot slot="home-top" className="my-8" />

      {/* ── BRAND SECTIONS ─────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div
          style={{
            maxWidth: '980px',
            margin: '80px auto',
            padding: '80px 22px',
            textAlign: 'center',
            color: '#6e6e73',
          }}
        >
          Loading repair database...
        </div>
      ) : (
        <>
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
                    padding: 'clamp(48px, 6vw, 72px) 22px',
                  }}
                >
                  {/* Brand heading */}
                  <ScrollReveal delay={0}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '10px',
                        marginBottom: '28px',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: 'clamp(26px, 4vw, 36px)',
                          fontWeight: 700,
                          letterSpacing: '-0.025em',
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
                        {items.length}개 가이드
                      </span>
                    </div>
                  </ScrollReveal>

                  {/* Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '14px',
                    }}
                  >
                    {items.map((r, cardIndex) => (
                      <ScrollReveal
                        key={r.id}
                        delay={Math.min(cardIndex, 5) * 60}
                      >
                        <a
                          href={`/${r.slug}`}
                          className="repair-card"
                          style={{
                            display: 'block',
                            backgroundColor: isAlt ? '#ffffff' : '#f5f5f7',
                            borderRadius: '16px',
                            padding: '22px 20px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            textDecoration: 'none',
                            color: 'inherit',
                            height: '100%',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 600,
                              color: '#1d1d1f',
                              lineHeight: 1.35,
                              marginBottom: r.error_code || r.part_name ? '10px' : 0,
                            }}
                          >
                            {r.model}
                          </div>
                          {r.error_code && (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#fff0f0',
                                color: '#d70015',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 9px',
                                borderRadius: '20px',
                                letterSpacing: '0.03em',
                                marginBottom: r.part_name ? '8px' : 0,
                              }}
                            >
                              {r.error_code}
                            </span>
                          )}
                          {r.part_name && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#6e6e73',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: '6px',
                              }}
                            >
                              {r.part_name}
                            </div>
                          )}
                        </a>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <ScrollReveal>
        <section
          style={{
            backgroundColor: '#1d1d1f',
            padding: 'clamp(64px, 8vw, 100px) 22px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 700,
                color: '#f5f5f7',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                marginBottom: '16px',
              }}
            >
              에러 코드를 못 찾으셨나요?
            </h2>
            <p
              style={{
                fontSize: '17px',
                color: '#a1a1a6',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              매일 새로운 수리 가이드가 추가됩니다. 잠시 후 다시 방문하거나 위의 브랜드 목록을 확인해보세요.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                backgroundColor: '#0071e3',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 500,
                padding: '12px 26px',
                borderRadius: '980px',
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              브랜드 목록으로 ↑
            </a>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
