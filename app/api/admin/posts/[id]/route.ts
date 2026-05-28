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
  const body = await req.json();
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('parts_db')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
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
  const supabase = getAdminClient();
  const { error } = await supabase.from('parts_db').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
