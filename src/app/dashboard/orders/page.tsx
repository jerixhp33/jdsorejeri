export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrdersList } from '@/components/dashboard/OrdersList';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles').select('id').eq('uid', user.id).single();
  if (!profile) redirect('/login');

  const { data: orders } = await admin
    .from('orders')
    .select(`
      *,
      delivery_address:delivery_addresses(*),
      shipments(*),
      events:order_events(*),
      items:order_items(
        *,
        product:products(id, name, slug, images:product_images(url, is_primary)),
        poster_size:poster_sizes(label)
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return <OrdersList orders={orders || []} />;
}
