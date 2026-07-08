export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminMarqueeView } from '@/components/admin/AdminMarqueeView';

export default async function AdminMarqueePage() {
  const supabase = await createAdminClient();
  
  // Note: if the table doesn't exist yet, it will return an error but not crash the build
  // We'll gracefully handle it by passing an empty array or the data
  const { data: labels, error } = await supabase
    .from('marquee_labels')
    .select('*')
    .order('order_index', { ascending: true });
    
  if (error) {
    console.error('Error fetching marquee labels (table might not exist yet):', error);
  }

  return <AdminMarqueeView labels={labels || []} />;
}
