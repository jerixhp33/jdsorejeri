export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminBroadcastView } from '@/components/admin/AdminBroadcastView';

export default async function AdminBroadcastPage() {
  const supabase = await createAdminClient();
  const [{ data: campaigns }, { data: users }] = await Promise.all([
    supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('id, name, email').order('name'),
  ]);

  return <AdminBroadcastView campaigns={campaigns || []} users={users || []} />;
}
