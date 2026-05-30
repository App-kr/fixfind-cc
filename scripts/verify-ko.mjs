/** verify-ko.mjs — solution_ko 채움 현황 확인 (키 노출 없음) */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}
const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' };

async function count(filter) {
  const r = await fetch(`${URL}/rest/v1/parts_db?select=id${filter}`, { headers: { ...H, Range: '0-0' } });
  const cr = r.headers.get('content-range') || '';
  return cr.split('/')[1] || '?';
}
const total = await count('');
const missing = await count('&solution_ko=is.null');
const filled = await count('&solution_ko=not.is.null');
console.log(`전체 게시물: ${total}개`);
console.log(`한글 채워짐: ${filled}개`);
console.log(`한글 미생성: ${missing}개`);
console.log(missing === '0' ? '\n✅ 모든 게시물에 한글 가이드 존재' : `\n⚠️ ${missing}개 아직 비어있음`);
