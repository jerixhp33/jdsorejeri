export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { getAnalyticsSummary, getDailySales, getTopProducts, getLowStockItems } from '@/lib/analytics';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const [summary, dailySales, topProducts, lowStockItems] = await Promise.all([
    getAnalyticsSummary(),
    getDailySales(30),
    getTopProducts(5),
    getLowStockItems(6),
  ]);

  const supabase = await createAdminClient();
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, user:user_profiles(name, email), delivery_address:delivery_addresses(district)')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <AdminDashboard
      summary={summary}
      dailySales={dailySales}
      topProducts={topProducts}
      recentOrders={recentOrders || []}
      lowStockItems={lowStockItems}
    />
  );
}
