import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { OrderDetailsView } from '@/components/admin/OrderDetailsView';
import type { Order } from '@/types';

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createAdminClient();
  const { id } = await params;

  if (!id) return notFound();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      user:user_profiles(name, email, phone),
      delivery_address:delivery_addresses(*),
      items:order_items(
        *,
        product:products(name, slug, images:product_images(url)),
        poster_size:poster_sizes(label)
      ),
      events:order_events(*),
      payments(*),
      shipments(*),
      returns(*),
      refunds(*)
    `)
    .eq('id', id)
    .single();

  if (!order) return notFound();

  // Sort events newest first
  if (order.events) {
    order.events.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  
  // Sort shipments newest first
  if (order.shipments) {
    order.shipments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return <OrderDetailsView initialOrder={order as Order} />;
}
