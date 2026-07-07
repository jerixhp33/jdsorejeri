export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminTestimonialsView } from '@/components/admin/AdminTestimonialsView';

export default async function AdminTestimonialsPage() {
  const supabase = await createAdminClient();
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true });
  return <AdminTestimonialsView testimonials={testimonials || []} />;
}