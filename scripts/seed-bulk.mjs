/**
 * Bulk seed script — calls the cron endpoint 5 times with count=10
 * Usage: node scripts/seed-bulk.mjs
 * Requires: CRON_SECRET env var (reads from .env.local automatically via dotenv)
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
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
const secret = env.CRON_SECRET || process.env.CRON_SECRET;
const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!secret) {
  console.error('ERROR: CRON_SECRET not found in .env.local');
  process.exit(1);
}

async function seedBatch(batchNum, count = 10) {
  const url = `${baseUrl}/api/cron/sync?count=${count}`;
  console.log(`\n[Batch ${batchNum}] GET ${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json();
  if (body.ok) {
    // route returns { upserted, entries } (logSyncRun uses *_count internally)
    const up = body.upserted ?? body.upserted_count ?? 0;
    const en = body.entries ?? body.entries_count ?? 0;
    console.log(`  ✅ upserted=${up}/${en}`);
    // Only non-AliExpress errors matter (ali key missing is expected until configured)
    const realErrors = (body.errors || []).filter((e) => !/ ali: /.test(e));
    if (realErrors.length) console.log(`  ⚠️  errors:`, realErrors);
    body.upserted_count = up; // normalize for caller
  } else {
    console.error(`  ❌ failed:`, body.error || body);
  }
  return body;
}

// CLI: --batches=N --count=M  (defaults 5 × 10 = 50)
const arg = (name, def) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? parseInt(a.split('=')[1], 10) : def;
};
const BATCHES = arg('batches', 5);
const PER = arg('count', 10);
const DELAY_MS = 4000; // 4s between batches to be polite to Gemini

console.log(`Seeding ${BATCHES} batches of ${PER} entries = up to ${BATCHES * PER} new entries`);
console.log(`Target: ${baseUrl}`);

let totalUpserted = 0;
for (let i = 1; i <= BATCHES; i++) {
  const body = await seedBatch(i, PER);
  totalUpserted += body?.upserted_count || 0;
  if (i < BATCHES) {
    console.log(`  Waiting ${DELAY_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}
console.log(`\nTotal upserted this run: ${totalUpserted}`);

console.log('\nDone! Check https://fixfind.cc or your Supabase dashboard.');
