export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminUsersView } from '@/components/admin/AdminUsersView';

export default async function AdminUsersPage() {
  const supabase = await createAdminClient();
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: loginStats } = await supabase
    .from('login_logs')
    .select('user_id')
    .gte('login_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const activeUserIds = new Set((loginStats || []).map((l) => l.user_id));

  return <AdminUsersView users={users || []} activeUserIds={activeUserIds} />;
}
