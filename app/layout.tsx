import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc';
const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'fixfind.cc — Robot Vacuum Error Codes & Repair Guides',
    template: '%s · fixfind.cc'
  },
  description:
    'Fix your robot vacuum fast. Error codes, causes, and step-by-step repair guides for iRobot Roomba, Xiaomi, Ecovacs, Neato, Roborock, Eufy, and more.',
  openGraph: {
    type: 'website',
    siteName: 'fixfind.cc',
    title: 'fixfind.cc — Robot Vacuum Repair Database',
    description: 'Error codes and repair guides for every robot vacuum brand.'
  },
  robots: { index: true, follow: true }
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
      <body className="min-h-screen bg-white text-gray-900 antialiased" style={{ fontSize: '17px', lineHeight: '1.7' }}>
        <header className="border-b-2 border-gray-900 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-black tracking-tight text-gray-900">
              🔧 fixfind.cc
            </a>
            <nav className="text-sm font-medium text-gray-600">
              Robot Vacuum Repair DB
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t-2 border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-gray-500">
            fixfind.cc — Repair guides updated daily. As an AliExpress Affiliate, we earn from qualifying purchases.
          </div>
        </footer>
      </body>
    </html>
  );
}
