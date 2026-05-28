import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME_EXPORT } from '@/lib/admin-auth';
import { getAdminClient } from '@/lib/supabase';
import { makeSlug } from '@/lib/slug';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME_EXPORT)?.value ?? '';
  return verifySession(token) !== null;
}

// GET: 전체 목록 (페이지네이션)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const brand = url.searchParams.get('brand') ?? '';

  const supabase = getAdminClient();
  let query = supabase
    .from('parts_db')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (brand) query = query.eq('brand', brand);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}

// POST: 새 게시물
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { brand, model, error_code, solution, solution_ko, part_name, affiliate_url, affiliate_price } = body as {
    brand?: string;
    model?: string;
    error_code?: string;
    solution?: string;
    solution_ko?: string;
    part_name?: string;
    affiliate_url?: string;
    affiliate_price?: number | null;
  };
  if (!brand || !model || !solution) {
    return NextResponse.json({ error: 'brand, model, solution required' }, { status: 400 });
  }
  const slug = makeSlug(brand, model, error_code);
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('parts_db')
    .upsert(
      {
        brand,
        model,
        error_code: error_code ?? '',
        solution,
        solution_ko: solution_ko ?? null,
        part_name: part_name ?? null,
        affiliate_url: affiliate_url ?? null,
        affiliate_price: affiliate_price ?? null,
        slug,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
