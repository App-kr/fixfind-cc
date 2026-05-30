/**
 * fix-model-names.mjs — model 필드에서 중복된 브랜드 접두어 제거 + slug 재생성
 *
 *   node scripts/fix-model-names.mjs --dry   # 미리보기만
 *   node scripts/fix-model-names.mjs         # 실제 적용
 *
 * 예: brand="Dreame", model="Dreame L10 Pro" → model="L10 Pro", slug 재생성
 * 안전장치: 재생성 slug 가 다른 행과 충돌하면 해당 행은 건너뜀(URL 보존).
 */
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
const DRY = process.argv.includes('--dry');
const H = { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

function normalizeSegment(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function makeSlug(brand, model, errorCode) {
  const b = normalizeSegment(brand), m = normalizeSegment(model);
  if (!errorCode || !errorCode.trim()) return `${b}/${m}`;
  const er = normalizeSegment(errorCode);
  if (m.endsWith(er)) return `${b}/${m}`;
  return `${b}/${m}-${er}`;
}

const rows = await (await fetch(`${SB_URL}/rest/v1/parts_db?select=id,brand,model,error_code,slug&limit=300`, { headers: H })).json();
const usedSlugs = new Set(rows.map((r) => r.slug));

let fixed = 0, skipped = 0;
for (const r of rows) {
  const b = (r.brand || '').toLowerCase();
  const m = (r.model || '').toLowerCase();
  if (!b || !m.startsWith(b + ' ')) continue; // 브랜드 접두어 없으면 패스

  const newModel = r.model.slice(r.brand.length).trim();
  if (!newModel) { skipped++; continue; }
  const newSlug = makeSlug(r.brand, newModel, r.error_code || '');

  if (newSlug === r.slug) continue;
  if (usedSlugs.has(newSlug)) {
    console.log(`  ⏭️  [${r.id}] 충돌로 건너뜀: ${r.slug} → ${newSlug} (이미 존재)`);
    skipped++; continue;
  }

  console.log(`  ${DRY ? '🔍' : '✅'} [${r.id}] "${r.brand} ${r.model}" → "${r.brand} ${newModel}"  |  ${r.slug} → ${newSlug}`);
  if (!DRY) {
    const res = await fetch(`${SB_URL}/rest/v1/parts_db?id=eq.${r.id}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ model: newModel, slug: newSlug, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) { console.log(`     ❌ 실패 ${res.status}`); skipped++; continue; }
    usedSlugs.delete(r.slug); usedSlugs.add(newSlug);
  }
  fixed++;
}
console.log(`\n📊 ${DRY ? '[DRY] ' : ''}정규화 ${fixed}건 / 건너뜀 ${skipped}건 / 전체 ${rows.length}건`);
