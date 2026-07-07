export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminSettingsView } from '@/components/admin/AdminSettingsView';

export default async function AdminSettingsPage() {
  const supabase = await createAdminClient();
  const { data: settings } = await supabase.from('settings').select('*').order('key');
  return <AdminSettingsView settings={settings || []} />;
}
