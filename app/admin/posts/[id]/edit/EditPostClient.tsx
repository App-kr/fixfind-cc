'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BRANDS = ['iRobot', 'Roborock', 'Ecovacs', 'Dreame', 'Narwal', 'LG', 'Samsung', 'Xiaomi', 'Eufy', 'Shark', 'Neato'];

type PostData = {
  id: number;
  brand: string;
  model: string;
  error_code: string | null;
  solution: string;
  solution_ko: string | null;
  part_name: string | null;
  affiliate_url: string | null;
  affiliate_price: number | null;
  slug: string;
  [key: string]: unknown;
};

type FormState = {
  brand: string;
  model: string;
  error_code: string;
  solution: string;
  solution_ko: string;
  part_name: string;
  affiliate_url: string;
  affiliate_price: string;
};

export default function EditPostClient({ post }: { post: PostData }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    brand: post.brand ?? '',
    model: post.model ?? '',
    error_code: post.error_code ?? '',
    solution: post.solution ?? '',
    solution_ko: post.solution_ko ?? '',
    part_name: post.part_name ?? '',
    affiliate_url: post.affiliate_url ?? '',
    affiliate_price: post.affiliate_price?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k: keyof FormState, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          affiliate_price: form.affiliate_price ? parseFloat(form.affiliate_price) : null,
        }),
      });
      const j = await res.json();
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(j.error ?? '저장 실패');
      }
    } catch {
      setError('Network error');
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #d2d2d7',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1d1d1f',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, backgroundColor: '#1d1d1f', color: '#f5f5f7', padding: '32px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '0.5px solid #3a3a3c' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>fixfind</div>
          <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '4px' }}>관리자</div>
        </div>
        <nav style={{ padding: '20px 0' }}>
          <a
            href="/admin/dashboard"
            style={{ display: 'block', padding: '10px 24px', fontSize: '14px', color: '#f5f5f7', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3c')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ← 대시보드
          </a>
        </nav>
      </aside>

      {/* Editor */}
      <main style={{ flex: 1, backgroundColor: '#f5f5f7', padding: '40px 48px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          게시물 수정
        </h1>
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '32px', marginTop: 0 }}>
          {post.slug}
        </p>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>브랜드</label>
              <select value={form.brand} onChange={e => set('brand', e.target.value)} style={inputStyle}>
                <option value="">선택</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>모델명</label>
              <input
                type="text"
                value={form.model}
                onChange={e => set('model', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>에러코드 / 증상</label>
              <input
                type="text"
                value={form.error_code}
                onChange={e => set('error_code', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>부품명</label>
              <input
                type="text"
                value={form.part_name}
                onChange={e => set('part_name', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>어필리에이트 URL</label>
              <input
                type="url"
                value={form.affiliate_url}
                onChange={e => set('affiliate_url', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>가격 (USD)</label>
              <input
                type="number"
                value={form.affiliate_price}
                onChange={e => set('affiliate_price', e.target.value)}
                step="0.01"
                min="0"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>영어 수리 가이드</label>
            <textarea
              value={form.solution}
              onChange={e => set('solution', e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
            <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '4px' }}>
              {form.solution.length}/800자
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>한국어 수리 가이드</label>
            <textarea
              value={form.solution_ko}
              onChange={e => set('solution_ko', e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
            <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '4px' }}>
              {form.solution_ko.length}/800자
            </div>
          </div>

          {error && (
            <p style={{ color: '#d70015', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 32px',
                backgroundColor: '#0071e3',
                color: '#fff',
                borderRadius: '980px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {saving ? '저장 중...' : '변경 저장'}
            </button>
            <a
              href="/admin/dashboard"
              style={{
                padding: '12px 24px',
                borderRadius: '980px',
                border: '1.5px solid #d2d2d7',
                fontSize: '15px',
                color: '#1d1d1f',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              취소
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
