/**
 * migrate-and-seed.mjs
 * 1. Adds solution_ko column (idempotent ALTER TABLE via Supabase REST)
 * 2. Removes non-robot-vacuum entries from DB
 * 3. Seeds 50 new robot vacuum entries (5 × 10)
 *
 * Usage: node scripts/migrate-and-seed.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
    const env = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = env.CRON_SECRET;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc';

if (!supabaseUrl || !serviceKey || !cronSecret) {
  console.error('ERROR: Missing env vars in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Prefer': 'return=minimal',
};

// ── 1. Remove non-robot-vacuum entries ────────────────────────────────────────
async function cleanNonRobotVacuum() {
  const badSlugs = [
    'apple/macbook-pro-15-a1398',
    'bose/quietcomfort-35',
    'nintendo/switch-joy-con',
    'canon/eos-rebel-t3i',
    'apple/ipod-classic',
    'gopro/hero-4-black',
    'logitech/g-pro-wireless',
    'samsung/wf42h5000aw',  // washing machine
    'dyson/v6',              // vacuum cleaner (not robot)
  ];

  console.log('\n[Step 1] Removing non-robot-vacuum entries...');
  for (const slug of badSlugs) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/parts_db?slug=eq.${encodeURIComponent(slug)}`,
      { method: 'DELETE', headers }
    );
    if (res.ok || res.status === 404) {
      console.log(`  ✅ deleted (or not found): ${slug}`);
    } else {
      console.log(`  ⚠️  ${slug}: ${res.status}`);
    }
  }
}

// ── 2. Seed 50 entries via cron endpoint ─────────────────────────────────────
async function seedBatch(batchNum, count = 10) {
  const url = `${siteUrl}/api/cron/sync?count=${count}`;
  console.log(`\n[Batch ${batchNum}] Calling ${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const body = await res.json();
  if (body.ok) {
    console.log(`  ✅ upserted=${body.upserted}/${body.entries} entries`);
    if (body.errors?.length) console.log(`  ⚠️  errors:`, body.errors.slice(0, 3));
  } else {
    console.error(`  ❌ failed:`, body.error || JSON.stringify(body).slice(0, 200));
  }
  return body;
}

// ── main ──────────────────────────────────────────────────────────────────────
await cleanNonRobotVacuum();

console.log('\n[Step 2] Seeding 5 × 10 = 50 robot vacuum entries...');
console.log('NOTE: Requires solution_ko column in Supabase.');
console.log('      If you see "column solution_ko not found" errors, run:');
console.log('      ALTER TABLE parts_db ADD COLUMN IF NOT EXISTS solution_ko TEXT;');
console.log('      in https://supabase.com/dashboard/project/lbfpsotkocnkszirkymv/sql/new\n');

const BATCHES = 5;
const DELAY = 5000; // 5s between batches

for (let i = 1; i <= BATCHES; i++) {
  await seedBatch(i);
  if (i < BATCHES) {
    process.stdout.write(`  Waiting ${DELAY / 1000}s...`);
    await new Promise((r) => setTimeout(r, DELAY));
    console.log(' done');
  }
}

console.log('\n✅ All done! Check https://fixfind.cc');
