/**
 * fill-affiliate.mjs — 64개 게시물에 알리익스프레스 제휴링크 백필 (독립 실행형)
 *
 * 사용법:
 *   node scripts/fill-affiliate.mjs          # affiliate_url 없는 것만
 *   node scripts/fill-affiliate.mjs --force  # 전체 갱신
 *   node scripts/fill-affiliate.mjs --dry    # 알리 호출 없이 키워드만 출력
 *
 * 요구: .env.local 에 ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET / ALIEXPRESS_TRACKING_ID
 *      + NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */
import crypto from 'node:crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('='); if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}
const env = loadEnv();
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APP_KEY = env.ALIEXPRESS_APP_KEY;
const APP_SECRET = env.ALIEXPRESS_APP_SECRET;
const TRACKING_ID = env.ALIEXPRESS_TRACKING_ID || 'default';
const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry');

if (!SB_URL || !SB_KEY) { console.error('❌ Supabase 환경변수 누락'); process.exit(1); }
if (!DRY && (!APP_KEY || !APP_SECRET)) {
  console.error('\n❌ ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET 가 .env.local 에 없습니다.');
  console.error('   알리익스프레스 제휴(포털) 개발자 앱을 만든 뒤 App Key / App Secret 를');
  console.error('   메모장으로 .env.local 에 추가하고 다시 실행하세요. (--dry 로 키워드만 확인 가능)\n');
  process.exit(1);
}

const SB_H = { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

// ── 알리 API ────────────────────────────────────────────────────────────────
const ENDPOINT = 'https://api-sg.aliexpress.com/sync';
function tsGmt8() { return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '); }
function sign(params, secret) {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret).update(sorted, 'utf8').digest('hex').toUpperCase();
}
async function call(method, biz) {
  const all = { method, app_key: APP_KEY, sign_method: 'sha256', timestamp: tsGmt8(), format: 'json', v: '2.0',
    ...Object.fromEntries(Object.entries(biz).map(([k, v]) => [k, String(v)])) };
  all.sign = sign(all, APP_SECRET);
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(all).toString(), cache: 'no-store' });
  if (!res.ok) throw new Error(`AliExpress HTTP ${res.status}`);
  const json = await res.json();
  if (json?.error_response) throw new Error(`AliExpress: ${JSON.stringify(json.error_response).slice(0, 200)}`);
  return json;
}
async function findCheapest(keyword) {
  const data = await call('aliexpress.affiliate.product.query', {
    keywords: keyword, page_size: 20, page_no: 1, sort: 'SALE_PRICE_ASC',
    target_currency: 'USD', target_language: 'EN', tracking_id: TRACKING_ID });
  const products = data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
  if (!Array.isArray(products) || products.length === 0) return null;
  const filtered = products.map((p) => ({
    title: String(p.product_title || ''), image_url: String(p.product_main_image_url || ''),
    source_url: String(p.product_detail_url || ''), price_usd: Number(p.target_sale_price || p.sale_price || 0),
    rate: Number(String(p.evaluate_rate || '0').replace('%', '')) || 0,
    promo: p.promotion_link ? String(p.promotion_link) : '',
  })).filter((p) => p.source_url && p.title && p.price_usd > 0 && p.rate >= 85);
  if (filtered.length === 0) return null;
  const best = filtered.sort((a, b) => a.price_usd - b.price_usd)[0];
  let url = best.promo;
  if (!url) {
    try {
      const gen = await call('aliexpress.affiliate.link.generate', {
        promotion_link_type: 0, source_values: best.source_url, tracking_id: TRACKING_ID });
      url = String(gen?.aliexpress_affiliate_link_generate_response?.resp_result?.result
        ?.promotion_links?.promotion_link?.[0]?.promotion_link || '');
    } catch { url = ''; }
  }
  if (!url) url = best.source_url;
  return { affiliate_url: url, price_usd: best.price_usd, image_url: best.image_url };
}

// ── Supabase ──────────────────────────────────────────────────────────────
async function sbGet(path) { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: SB_H }); return r.json(); }
async function sbPatch(id, data) {
  const r = await fetch(`${SB_URL}/rest/v1/parts_db?id=eq.${id}`, {
    method: 'PATCH', headers: { ...SB_H, Prefer: 'return=minimal' }, body: JSON.stringify(data) });
  return r.ok;
}

// ── 메인 ────────────────────────────────────────────────────────────────────
console.log(`\n🛒  알리익스프레스 제휴링크 백필${DRY ? ' [DRY — 키워드만]' : ''}`);
console.log(`   tracking_id: ${TRACKING_ID}\n`);

const sel = 'id,brand,model,part_name,affiliate_url';
const q = FORCE ? `parts_db?select=${sel}&order=id.asc&limit=300`
                : `parts_db?select=${sel}&affiliate_url=is.null&order=id.asc&limit=300`;
const rows = await sbGet(q);
const todo = rows.filter((r) => (FORCE || !r.affiliate_url) && r.part_name);
console.log(`처리 예정: ${todo.length}개\n`);

let done = 0, failed = 0, none = 0;
for (const r of todo) {
  const keyword = `${r.brand} ${r.model} ${r.part_name}`.replace(/\s+/g, ' ').trim();
  process.stdout.write(`  [ID ${String(r.id).padStart(3)}] ${keyword.slice(0, 50)}... `);
  if (DRY) { console.log('🔍'); done++; continue; }
  try {
    const ali = await findCheapest(keyword);
    if (!ali) { console.log('— 매칭 없음'); none++; await sleep(1100); continue; }
    const ok = await sbPatch(r.id, { affiliate_url: ali.affiliate_url, affiliate_price: ali.price_usd,
      affiliate_image: ali.image_url, updated_at: new Date().toISOString() });
    if (!ok) throw new Error('Supabase PATCH 실패');
    console.log(`✅ $${ali.price_usd}`);
    done++;
  } catch (e) { console.log(`❌ ${String(e.message).slice(0, 80)}`); failed++; }
  await sleep(1100); // 알리 QPS 보호
}
function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 성공 ${done} | 매칭없음 ${none} | 실패 ${failed} | 전체 ${todo.length}`);
