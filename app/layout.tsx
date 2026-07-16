import './globals.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc';
const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GOOGLE_VERIFY = process.env.GOOGLE_SITE_VERIFICATION;
const NAVER_VERIFY = process.env.NAVER_SITE_VERIFICATION;

// 검색엔진 소유확인(verification) — 값이 있을 때만 태그 출력
const verification: Metadata['verification'] = {};
if (GOOGLE_VERIFY) verification.google = GOOGLE_VERIFY;
if (NAVER_VERIFY) verification.other = { 'naver-site-verification': NAVER_VERIFY };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'fixfind — 로봇청소기 수리 가이드',
    template: '%s · fixfind'
  },
  description:
    '로봇청소기 에러코드 해석, 원인 분석, 단계별 수리 방법을 제공합니다. 아이로봇 룸바, 로보락, 에코백스, 드리미, 나르왈, 삼성, LG 등 전 브랜드 지원.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'fixfind',
    title: 'fixfind — 로봇청소기 수리 가이드',
    description: '전 브랜드 로봇청소기 에러코드와 수리 가이드'
  },
  verification,
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
        {/* Google Analytics 4 — 방문자 측정 (NEXT_PUBLIC_GA_ID 있을 때만) */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
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
