import './globals.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc';
const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'fixfind — Robot Vacuum Repair Guides',
    template: '%s · fixfind'
  },
  description:
    'Fix your robot vacuum fast. Error codes, causes, and step-by-step repair guides for iRobot Roomba, Xiaomi, Ecovacs, Neato, Roborock, Eufy, and more.',
  openGraph: {
    type: 'website',
    siteName: 'fixfind',
    title: 'fixfind — Robot Vacuum Repair Database',
    description: 'Error codes and repair guides for every robot vacuum brand.'
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
    <html lang="en">
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
              Robot Vacuum Repair
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
              fixfind is an independent repair guide. As an AliExpress Affiliate, we may earn from qualifying purchases.
              Repair guides are updated daily.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
