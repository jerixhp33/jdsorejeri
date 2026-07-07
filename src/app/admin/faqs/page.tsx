export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminFAQsView } from '@/components/admin/AdminFAQsView';

export default async function AdminFAQsPage() {
  const supabase = await createAdminClient();
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true });
  return <AdminFAQsView faqs={faqs || []} />;
}