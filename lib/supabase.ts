import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE admin env vars');
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export function getPublicClient(): SupabaseClient {
  if (_public) return _public;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE public env vars');
  _public = createClient(url, key, { auth: { persistSession: false } });
  return _public;
}

export type PartRow = {
  brand: string;
  model: string;
  error_code: string;
  solution: string;
  solution_ko?: string | null;
  part_name: string;
  affiliate_url: string | null;
  affiliate_price: number | null;
  affiliate_image: string | null;
  slug: string;
};

export async function upsertPart(row: PartRow): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('parts_db')
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
  if (error) throw new Error(`upsertPart failed: ${error.message}`);
}

export async function logSyncRun(payload: {
  entries_count: number;
  upserted_count: number;
  errors: string[];
  ok: boolean;
}): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.from('sync_runs').insert({
      entries_count: payload.entries_count,
      upserted_count: payload.upserted_count,
      errors: payload.errors,
      ok: payload.ok
    });
  } catch { /* never let logging crash cron */ }
}

export async function listAllSlugs(): Promise<string[]> {
  try {
    const supabase = getPublicClient();
    const { data } = await supabase.from('parts_db').select('slug').limit(2000);
    return (data || []).map((r: any) => String(r.slug));
  } catch {
    return [];
  }
}
