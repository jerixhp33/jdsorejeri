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
    console.error('Error fetching marquee labels:', error);
    return (
      <div className="p-8 text-red-400 glass-card">
        <h2 className="font-bold text-xl mb-4">Database Error</h2>
        <p>Failed to load marquee labels. Error details:</p>
        <pre className="mt-4 p-4 bg-black/40 rounded-xl overflow-auto text-sm">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return <AdminMarqueeView labels={labels || []} />;
}
