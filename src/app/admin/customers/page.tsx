import { createAdminClient } from '@/lib/supabase/server';
import { CustomerDashboardView } from '@/components/admin/CustomerDashboardView';
import type { Customer } from '@/types';

export default async function AdminCustomersPage() {
  const supabase = await createAdminClient();
  
  // Fetch customers with their associated user_profile and orders
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      user_profile:user_profiles(*),
      orders(id, status, grand_total, created_at)
    `)
    .order('created_at', { ascending: false });

  // If customers are fetched successfully, we will calculate LTV and segments on the fly
  return <CustomerDashboardView initialCustomers={customers || []} />;
}
