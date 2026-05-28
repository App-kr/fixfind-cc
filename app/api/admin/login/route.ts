import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { makeSessionToken, COOKIE_NAME_EXPORT, MAX_AGE_EXPORT } from '@/lib/admin-auth';

// 브루트포스 방어: in-memory
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip);

  // 잠금 체크
  if (rec && rec.until > now) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const { password } = body as { password?: string };
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const pwBuf = Buffer.from(password ?? '');
  const refBuf = Buffer.from(adminPw);
  const lengthMatch = pwBuf.length === refBuf.length;
  // timingSafeEqual requires same length; pad to prevent length-based leak
  const padLen = Math.max(pwBuf.length, refBuf.length);
  const a = Buffer.concat([pwBuf, Buffer.alloc(padLen - pwBuf.length)]);
  const b = Buffer.concat([refBuf, Buffer.alloc(padLen - refBuf.length)]);
  const ok = lengthMatch && crypto.timingSafeEqual(a, b);

  if (!ok) {
    const cur = rec ?? { count: 0, until: 0 };
    cur.count++;
    cur.until = cur.count >= 5 ? now + 15 * 60 * 1000 : 0; // 5회 실패 → 15분 잠금
    attempts.set(ip, cur);
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // 성공 → 카운터 초기화
  attempts.delete(ip);

  const token = makeSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME_EXPORT, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE_EXPORT,
    path: '/admin',
  });
  return res;
}
