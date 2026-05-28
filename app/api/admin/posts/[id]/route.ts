import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME_EXPORT } from '@/lib/admin-auth';
import { getAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME_EXPORT)?.value ?? '';
  return verifySession(token) !== null;
}

// PATCH: 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const raw = await req.json();
  // Allowlist — never let arbitrary fields overwrite slug/id
  const allowed = ['brand', 'model', 'error_code', 'solution', 'solution_ko',
                   'part_name', 'affiliate_url', 'affiliate_price'] as const;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in raw) patch[key] = raw[key] ?? null;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('parts_db')
    .update(patch)
    .eq('id', numericId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE: 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('parts_db').delete().eq('id', numericId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
