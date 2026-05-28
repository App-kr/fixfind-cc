import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession, COOKIE_NAME_EXPORT } from '@/lib/admin-auth';
import { getAdminClient } from '@/lib/supabase';
import EditPostClient from './EditPostClient';

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME_EXPORT)?.value ?? '';
  if (!verifySession(token)) redirect('/admin/login');

  const { id } = await params;
  const supabase = getAdminClient();
  const { data: post } = await supabase.from('parts_db').select('*').eq('id', id).single();
  if (!post) redirect('/admin/dashboard');

  return <EditPostClient post={post} />;
}
