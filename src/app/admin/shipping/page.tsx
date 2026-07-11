import { createAdminClient } from '@/lib/supabase/server';
import { ShippingDashboardView } from '@/components/admin/ShippingDashboardView';

export default async function AdminShippingPage() {
  const supabase = await createAdminClient();

  const [shipmentsRes, ordersRes] = await Promise.all([
    supabase
      .from('shipments')
      .select(`
        *,
        order:orders(
          id,
          order_number,
          created_at,
          status,
          fulfillment_status,
          delivery_address:delivery_addresses(*)
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        fulfillment_status,
        delivery_address:delivery_addresses(*)
      `)
      .in('status', ['processing', 'packed', 'shipped'])
      .order('created_at', { ascending: false })
  ]);

  return (
    <ShippingDashboardView 
      initialShipments={shipmentsRes.data || []} 
      pendingOrders={ordersRes.data || []} 
    />
  );
}
