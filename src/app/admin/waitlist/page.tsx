export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminWaitlistView } from '@/components/admin/AdminWaitlistView';

export default async function AdminWaitlistPage() {
  const admin = await createAdminClient();

  // Fetch waitlists with joined product, size, and user profile data
  const { data: waitlists } = await admin
    .from('waitlists')
    .select(`
      *,
      user_profile:user_profiles(name, email),
      product:products(name, product_type, images:product_images(url, is_primary)),
      poster_size:poster_sizes(label)
    `)
    .order('created_at', { ascending: false });

  return <AdminWaitlistView waitlists={waitlists || []} />;
}
