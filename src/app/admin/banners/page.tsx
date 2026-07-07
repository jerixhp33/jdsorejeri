export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminBannersView } from '@/components/admin/AdminBannersView';

export default async function AdminBannersPage() {
  const supabase = await createAdminClient();
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('display_order');

  return <AdminBannersView banners={banners || []} />;
}
