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
  console.log(`\n[Batch ${batchNum}] POST ${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json();
  if (body.ok) {
    console.log(`  ✅ upserted=${body.upserted_count}/${body.entries_count}`);
    if (body.errors?.length) console.log(`  ⚠️  errors:`, body.errors);
  } else {
    console.error(`  ❌ failed:`, body.error || body);
  }
  return body;
}

const BATCHES = 5;   // 5 × 10 = 50 new entries
const DELAY_MS = 4000; // 4s between batches to be polite to Gemini

console.log(`Seeding ${BATCHES} batches of 10 entries = up to 50 new entries`);
console.log(`Target: ${baseUrl}`);

for (let i = 1; i <= BATCHES; i++) {
  await seedBatch(i);
  if (i < BATCHES) {
    console.log(`  Waiting ${DELAY_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}

console.log('\nDone! Check https://fixfind.cc or your Supabase dashboard.');
