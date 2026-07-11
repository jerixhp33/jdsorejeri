import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { CustomerProfileView } from '@/components/admin/CustomerProfileView';

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: customer } = await supabase
    .from('customers')
    .select(`
      *,
      user_profile:user_profiles(
        *,
        delivery_addresses(*)
      ),
      orders(
        *,
        order_items(*, product:products(name, category_id, images)),
        shipments(*),
        order_events(*)
      )
    `)
    .eq('id', id)
    .single();

  if (!customer) {
    return notFound();
  }

  return <CustomerProfileView customer={customer} />;
}
