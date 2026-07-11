import { createAdminClient } from '@/lib/supabase/server';
import { CustomerAnalyticsService } from '@/lib/customer-analytics';
import { CustomerAnalyticsView } from '@/components/admin/CustomerAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function GlobalCustomerAnalyticsPage() {
  const supabase = await createAdminClient();

  // Fetch all customers for global analytics
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      orders(id, status, grand_total, created_at)
    `);

  const analytics = await CustomerAnalyticsService.getGlobalDistribution(customers || []);

  return <CustomerAnalyticsView analytics={analytics} totalCustomers={customers?.length || 0} />;
}
