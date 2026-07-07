export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { AdminLogsView } from '@/components/admin/AdminLogsView';

export default async function AdminLogsPage() {
  const supabase = await createClient();
  const [{ data: activityLogs }, { data: auditLogs }, { data: loginLogs }] = await Promise.all([
    supabase.from('activity_logs')
      .select('*, user:user_profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('audit_logs')
      .select('*, admin:user_profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('login_logs')
      .select('*, user:user_profiles(name, email)')
      .order('login_time', { ascending: false })
      .limit(100),
  ]);

  return (
    <AdminLogsView
      activityLogs={activityLogs || []}
      auditLogs={auditLogs || []}
      loginLogs={loginLogs || []}
    />
  );
}
