import './globals.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc';
const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'fixfind — 로봇청소기 수리 가이드',
    template: '%s · fixfind'
  },
  description:
    '로봇청소기 에러코드 해석, 원인 분석, 단계별 수리 방법을 제공합니다. 아이로봇 룸바, 로보락, 에코백스, 드리미, 나르왈, 삼성, LG 등 전 브랜드 지원.',
  openGraph: {
    type: 'website',
    siteName: 'fixfind',
    title: 'fixfind — 로봇청소기 수리 가이드',
    description: '전 브랜드 로봇청소기 에러코드와 수리 가이드'
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {ADSENSE && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className="min-h-screen bg-white antialiased"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
          color: '#1d1d1f',
          fontSize: '17px',
          lineHeight: '1.7',
        }}
      >
        {/* Apple-style sticky header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: '0.5px solid #d2d2d7',
          }}
        >
          <div
            style={{
              maxWidth: '980px',
              margin: '0 auto',
              padding: '0 22px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <a
              href="/"
              style={{
                fontSize: '21px',
                fontWeight: 600,
                color: '#1d1d1f',
                textDecoration: 'none',
                letterSpacing: '-0.5px',
              }}
            >
              fixfind
            </a>
            <span
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                letterSpacing: '0.01em',
              }}
            >
              로봇청소기 수리 가이드
            </span>
          </div>
        </header>

        {children}

        {/* Apple-style footer */}
        <footer style={{ backgroundColor: '#f5f5f7', marginTop: '80px' }}>
          <div
            style={{
              maxWidth: '980px',
              margin: '0 auto',
              padding: '40px 22px',
              borderTop: '0.5px solid #d2d2d7',
            }}
          >
            <p style={{ fontSize: '12px', color: '#6e6e73', lineHeight: '1.8', marginBottom: '8px' }}>
              Copyright &copy; 2025 fixfind. All rights reserved.
            </p>
            <p style={{ fontSize: '12px', color: '#6e6e73', lineHeight: '1.8' }}>
              fixfind은 독립 수리 가이드 사이트입니다. 본 사이트는 제휴 마케팅을 통해 수익을 얻을 수 있습니다. 수리 가이드는 매일 업데이트됩니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
