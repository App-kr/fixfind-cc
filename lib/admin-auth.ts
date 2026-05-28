import crypto from 'node:crypto';

const COOKIE_NAME = 'ff_admin';
const MAX_AGE = 60 * 60 * 8; // 8h

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET missing');
  return s;
}

export function signSession(payload: string): string {
  const secret = getSecret();
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySession(token: string): string | null {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot < 0) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const { exp } = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (Date.now() > exp) return null;
    return payload;
  } catch { return null; }
}

export function makeSessionToken(): string {
  const payload = Buffer.from(JSON.stringify({ ok: true, exp: Date.now() + MAX_AGE * 1000 })).toString('base64');
  return signSession(payload);
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
export const MAX_AGE_EXPORT = MAX_AGE;
