'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Post = {
  id: number;
  brand: string;
  model: string;
  error_code: string | null;
  part_name: string | null;
  slug: string;
  updated_at: string;
};

const SIDEBAR_W = 220;
const BRANDS = [
  '전체', 'Roborock', 'iRobot', 'Ecovacs', 'Dreame', 'Narwal',
  'Samsung', 'LG', 'Xiaomi', 'Eufy', 'Shark', 'Neato',
];

export default function AdminDashboardClient({
  initialPosts,
  totalCount,
  missingKoCount,
}: {
  initialPosts: Post[];
  totalCount: number;
  missingKoCount: number;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filterBrand, setFilterBrand] = useState('전체');
  const router = useRouter();

  // Korean generation state
  const [koStatus, setKoStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [koLog, setKoLog] = useState<string[]>([]);
  const [koMissing, setKoMissing] = useState(missingKoCount);

  const filtered = filterBrand === '전체' ? posts : posts.filter(p => p.brand === filterBrand);

  async function handleDelete(id: number, slug: string) {
    if (!confirm(`"${slug}" 를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== id));
    } else {
      alert('삭제 실패');
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  async function handleFillKo(force = false) {
    setKoStatus('running');
    setKoLog([]);
    let totalProcessed = 0;
    let round = 1;

    try {
      while (true) {
        setKoLog(prev => [...prev, `라운드 ${round} 처리 중...`]);
        const res = await fetch('/api/admin/fill-ko', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 20, force }),
        });
        const json = await res.json();

        if (!res.ok) {
          setKoLog(prev => [...prev, `❌ 오류: ${json.error ?? res.status}`]);
          setKoStatus('error');
          return;
        }

        const p = json.processed ?? 0;
        const f = json.failed ?? 0;
        totalProcessed += p;

        setKoLog(prev => [
          ...prev,
          `라운드 ${round}: ${p}개 생성${f > 0 ? `, ${f}개 실패` : ''} (누적 ${totalProcessed}개)`,
        ]);

        // Done when nothing left to process
        if (p === 0) break;
        round++;
        // Small pause between rounds
        await new Promise(r => setTimeout(r, 1000));
      }

      setKoLog(prev => [...prev, `✅ 완료 — 총 ${totalProcessed}개 한국어 가이드 생성`]);
      setKoMissing(0);
      setKoStatus('done');
    } catch (e: any) {
      setKoLog(prev => [...prev, `❌ 네트워크 오류: ${e?.message}`]);
      setKoStatus('error');
    }
  }

  const navItems = [
    { label: '대시보드', href: '/admin/dashboard' },
    { label: '새 게시물 작성', href: '/admin/posts/new' },
    { label: '공개 사이트 보기', href: '/', target: '_blank' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: SIDEBAR_W,
          backgroundColor: '#1d1d1f',
          color: '#f5f5f7',
          padding: '32px 0',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: '0 24px 32px', borderBottom: '0.5px solid #3a3a3c' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>fixfind</div>
          <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '4px' }}>관리자</div>
        </div>
        <nav style={{ padding: '20px 0' }}>
          {navItems.map(({ label, href, target }) => (
            <a
              key={label}
              href={href}
              target={target}
              style={{
                display: 'block',
                padding: '10px 24px',
                fontSize: '14px',
                color: '#f5f5f7',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3c')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {label}
            </a>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, padding: '0 24px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#3a3a3c',
              color: '#f5f5f7',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, backgroundColor: '#f5f5f7', padding: '40px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', margin: 0 }}>
              게시물 관리
            </h1>
            <p style={{ fontSize: '14px', color: '#6e6e73', marginTop: '4px', marginBottom: 0 }}>
              총 {totalCount}개 수리 가이드
            </p>
          </div>
          <a
            href="/admin/posts/new"
            style={{
              backgroundColor: '#0071e3',
              color: '#fff',
              padding: '10px 22px',
              borderRadius: '980px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            + 새 게시물
          </a>
        </div>

        {/* ── 한국어 일괄 생성 패널 ──────────────────────────── */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #0071e3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d1d1f' }}>
                🇰🇷 한국어 가이드 일괄 생성
              </div>
              <div style={{ fontSize: '13px', color: '#6e6e73', marginTop: '3px' }}>
                {koMissing > 0
                  ? `한국어 미생성 ${koMissing}개 — Gemini로 자동 작성`
                  : '모든 게시물에 한국어 가이드가 있습니다 ✅'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleFillKo(false)}
                disabled={koStatus === 'running' || koMissing === 0}
                style={{
                  padding: '9px 20px',
                  borderRadius: '980px',
                  backgroundColor: koMissing === 0 ? '#e5e5ea' : '#0071e3',
                  color: koMissing === 0 ? '#999' : '#fff',
                  border: 'none',
                  cursor: koStatus === 'running' || koMissing === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  opacity: koStatus === 'running' ? 0.6 : 1,
                }}
              >
                {koStatus === 'running' ? '생성 중...' : '미생성 채우기'}
              </button>
              <button
                onClick={() => handleFillKo(true)}
                disabled={koStatus === 'running'}
                style={{
                  padding: '9px 20px',
                  borderRadius: '980px',
                  backgroundColor: '#3a3a3c',
                  color: '#fff',
                  border: 'none',
                  cursor: koStatus === 'running' ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  opacity: koStatus === 'running' ? 0.6 : 1,
                }}
              >
                전체 덮어쓰기
              </button>
            </div>
          </div>

          {/* Log output */}
          {koLog.length > 0 && (
            <div
              style={{
                marginTop: '14px',
                backgroundColor: '#1d1d1f',
                borderRadius: '10px',
                padding: '14px 16px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#e5e5ea',
                lineHeight: 1.7,
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {koLog.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>

        {/* Brand filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {BRANDS.map(b => (
            <button
              key={b}
              onClick={() => setFilterBrand(b)}
              style={{
                padding: '6px 14px',
                borderRadius: '980px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterBrand === b ? '#1d1d1f' : '#e5e5ea',
                color: filterBrand === b ? '#fff' : '#1d1d1f',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e5ea' }}>
                {['브랜드', '모델', '에러코드', '부품명', '업데이트', '관리'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6e6e73',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1d1d1f' }}>{p.brand}</td>
                  <td style={{ padding: '14px 16px', color: '#1d1d1f' }}>{p.model}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.error_code && (
                      <span
                        style={{
                          backgroundColor: '#fff0f0',
                          color: '#d70015',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '20px',
                        }}
                      >
                        {p.error_code}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      color: '#6e6e73',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.part_name}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6e6e73', fontSize: '12px' }}>
                    {new Date(p.updated_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`/admin/posts/${p.id}/edit`}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#f0f0f0',
                          color: '#1d1d1f',
                          fontSize: '12px',
                          fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        수정
                      </a>
                      <button
                        onClick={() => handleDelete(p.id, p.slug)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#fff0f0',
                          color: '#d70015',
                          fontSize: '12px',
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: '48px', textAlign: 'center', color: '#6e6e73' }}
                  >
                    게시물이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
