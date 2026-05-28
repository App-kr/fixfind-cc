import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession, COOKIE_NAME_EXPORT } from '@/lib/admin-auth';
import { getAdminClient } from '@/lib/supabase';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME_EXPORT)?.value ?? '';
  if (!verifySession(token)) redirect('/admin/login');

  const supabase = getAdminClient();
  const { data: posts, count } = await supabase
    .from('parts_db')
    .select('id, brand, model, error_code, part_name, slug, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(50);

  return <AdminDashboardClient initialPosts={posts ?? []} totalCount={count ?? 0} />;
}
