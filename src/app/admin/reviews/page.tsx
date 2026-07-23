export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminReviewsView } from '@/components/admin/AdminReviewsView';

export default async function AdminReviewsPage() {
  const supabase = await createAdminClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      user_profiles ( name, email, profile_picture ),
      products ( name )
    `)
    .order('created_at', { ascending: false });
    
  return <AdminReviewsView initialReviews={reviews || []} />;
}
