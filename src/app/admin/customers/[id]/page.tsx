import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { CustomerProfileView } from '@/components/admin/CustomerProfileView';

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: userProfile, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      orders!orders_user_id_fkey(
        *,
        order_items(*, product:products(name, category_id, images)),
        shipments(*),
        order_events(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching userProfile:', error);
  }

  if (!userProfile) {
    return notFound();
  }

  const customer = {
    id: userProfile.id,
    user_id: userProfile.id,
    customer_number: 'CUST-' + userProfile.id.substring(0, 6).toUpperCase(),
    loyalty_points: 0,
    lifetime_points: 0,
    membership_tier: 'bronze',
    status: 'active',
    created_at: userProfile.created_at,
    updated_at: userProfile.updated_at,
    user_profile: userProfile,
    orders: userProfile.orders || []
  };

  if (!customer) {
    return notFound();
  }

  return <CustomerProfileView customer={customer} />;
}
