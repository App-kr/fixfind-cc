import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME_EXPORT } from '@/lib/admin-auth';

// Rate limiting: 단순 인메모리 (보조 수단)
const rateMap = new Map<string, number[]>();

function isRateLimited(ip: string, limit = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (rateMap.get(ip) ?? []).filter(t => now - t < windowMs);
  hits.push(now);
  rateMap.set(ip, hits);
  return hits.length > limit;
}

export function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anon';
  const { pathname } = req.nextUrl;

  // Rate limit: /api/ 전체
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(ip, 120, 60_000)) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }
  }

  // Admin page 보호 (/admin/login 제외)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get(COOKIE_NAME_EXPORT)?.value ?? '';
    if (!verifySession(token)) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // API admin 보호 (/api/admin/login 제외)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const token = req.cookies.get(COOKIE_NAME_EXPORT)?.value ?? '';
    if (!verifySession(token)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // Security headers
  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co",
      "frame-src https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
