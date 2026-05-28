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

  const [postsRes, missingRes] = await Promise.all([
    supabase
      .from('parts_db')
      .select('id, brand, model, error_code, part_name, slug, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('parts_db')
      .select('id', { count: 'exact', head: true })
      .is('solution_ko', null),
  ]);

  return (
    <AdminDashboardClient
      initialPosts={postsRes.data ?? []}
      totalCount={postsRes.count ?? 0}
      missingKoCount={missingRes.count ?? 0}
    />
  );
}
