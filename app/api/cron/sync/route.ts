import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchRepairEntries, clampCount, type RepairEntry } from '@/lib/gemini';
import { findCheapest } from '@/lib/aliexpress';
import { upsertPart, logSyncRun, listAllSlugs } from '@/lib/supabase';
import { makeSlug } from '@/lib/slug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

async function processEntry(entry: RepairEntry, stats: { upserted: number; errors: string[] }) {
  const slug = makeSlug(entry.brand, entry.model, entry.error_code);
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(slug)) {
    stats.errors.push(`bad slug: ${slug}`);
    return;
  }

  let ali: Awaited<ReturnType<typeof findCheapest>> = null;
  try {
    const keyword = `${entry.brand} ${entry.model} ${entry.part_name}`.trim();
    ali = await findCheapest(keyword);
  } catch (e: any) {
    stats.errors.push(`${slug} ali: ${e?.message || String(e)}`);
  }

  try {
    await upsertPart({
      brand: entry.brand,
      model: entry.model,
      error_code: entry.error_code,
      solution: entry.solution,
      solution_ko: entry.solution_ko || null,
      part_name: entry.part_name,
      affiliate_url: ali?.affiliate_url || null,
      affiliate_price: ali?.price_usd ?? null,
      affiliate_image: ali?.image_url || null,
      slug
    });
    stats.upserted++;
  } catch (e: any) {
    stats.errors.push(`${slug} upsert: ${e?.message || String(e)}`);
  }
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Daily cron passes no query → 1 entry. Manual seeding can pass ?count=10.
  const url = new URL(req.url);
  const count = clampCount(url.searchParams.get('count'), 1);

  const stats = { entries: 0, upserted: 0, requested: count, errors: [] as string[] };

  try {
    const existingSlugs = await listAllSlugs();
    const entries = await fetchRepairEntries(count, existingSlugs);
    stats.entries = entries.length;

    for (const entry of entries) {
      await processEntry(entry, stats);
    }

    revalidatePath('/');
    revalidatePath('/[brand]', 'page');          // 브랜드 허브
    revalidatePath('/[brand]/[model]', 'page');
    revalidatePath('/sitemap.xml');              // 신규 URL 즉시 sitemap 반영

    await logSyncRun({
      entries_count: stats.entries,
      upserted_count: stats.upserted,
      errors: stats.errors,
      ok: true
    });

    return NextResponse.json({ ok: true, ...stats, ts: new Date().toISOString() });
  } catch (e: any) {
    await logSyncRun({
      entries_count: stats.entries,
      upserted_count: stats.upserted,
      errors: [...stats.errors, e?.message || String(e)],
      ok: false
    });
    return NextResponse.json(
      { ok: false, error: e?.message || String(e), ...stats },
      { status: 500 }
    );
  }
}
