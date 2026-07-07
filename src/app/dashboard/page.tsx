export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileView } from '@/components/dashboard/ProfileView';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles').select('*').eq('uid', user.id).single();

  if (!profile) redirect('/login');

  const [{ data: loginLogs }, { count: orderCount }] = await Promise.all([
    admin.from('login_logs').select('*')
      .eq('user_id', profile.id)
      .order('login_time', { ascending: false }).limit(5),
    admin.from('orders').select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ]);

  return <ProfileView profile={profile} loginLogs={loginLogs || []} orderCount={orderCount || 0} />;
}
