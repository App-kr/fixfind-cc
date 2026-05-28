'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        const j = await res.json();
        setError(j.error ?? 'Login failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f7' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '48px 40px', width: '360px', boxShadow: '0 4px 32px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1d1d1f', marginBottom: '8px', textAlign: 'center' }}>fixfind</h1>
        <p style={{ fontSize: '14px', color: '#6e6e73', textAlign: 'center', marginBottom: '32px' }}>관리자 로그인</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1.5px solid #d2d2d7',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
              fontFamily: 'inherit',
            }}
          />
          {error && (
            <p style={{ color: '#d70015', fontSize: '13px', marginBottom: '12px', margin: '0 0 12px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              backgroundColor: '#0071e3',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
