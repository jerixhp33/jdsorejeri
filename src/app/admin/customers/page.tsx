import { createAdminClient } from '@/lib/supabase/server';
import { CustomerDashboardView } from '@/components/admin/CustomerDashboardView';
import type { Customer } from '@/types';

export default async function AdminCustomersPage() {
  const supabase = await createAdminClient();
  
  // Fetch users with their orders directly since customers table might not be automatically populated
  const { data: users } = await supabase
    .from('user_profiles')
    .select(`
      *,
      orders!orders_user_id_fkey(id, status, grand_total, created_at)
    `)
    .order('created_at', { ascending: false });

  // Synthesize customer records for the view
  const customers = (users || []).map((u: any) => ({
    id: u.id,
    user_id: u.id,
    customer_number: 'CUST-' + u.id.substring(0, 6).toUpperCase(),
    loyalty_points: 0,
    lifetime_points: 0,
    membership_tier: 'bronze',
    status: 'active',
    created_at: u.created_at,
    updated_at: u.updated_at,
    user_profile: u,
    orders: u.orders || []
  }));

  // If customers are fetched successfully, we will calculate LTV and segments on the fly
  return <CustomerDashboardView initialCustomers={customers} />;
}
