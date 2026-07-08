export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminOrdersView } from '@/components/admin/AdminOrdersView';

export default async function AdminOrdersPage() {
  const supabase = await createAdminClient();
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      user:user_profiles(name, email, phone),
      delivery_address:delivery_addresses(*),
      items:order_items(
        *,
        product:products(name, slug, images:product_images(url)),
        poster_size:poster_sizes(label)
      )
    `)
    .order('created_at', { ascending: false });

  return <AdminOrdersView initialOrders={orders || []} />;
}
