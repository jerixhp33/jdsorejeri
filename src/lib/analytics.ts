import { createAdminClient } from '@/lib/supabase/server';
import type { AnalyticsSummary, DailySales } from '@/types';

/**
 * Track an analytics event.
 */
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
  options?: {
    userId?: string;
    sessionId?: string;
    page?: string;
    device?: string;
    browser?: string;
    ip?: string;
  }
): Promise<void> {
  const supabase = await createAdminClient();

  await supabase.from('analytics_events').insert({
    event_type: eventType,
    event_data: eventData || {},
    user_id: options?.userId || null,
    session_id: options?.sessionId || null,
    page: options?.page || null,
    device: options?.device || null,
    browser: options?.browser || null,
    ip_address: options?.ip || null,
  });
}

/**
 * Get analytics summary for admin dashboard.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Total users
  const { count: totalUsers } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });

  // Today's new users
  const { count: todayUsers } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00`);

  // Total orders
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // Today's orders
  const { count: todayOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00`);

  // Total revenue
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total')
    .not('status', 'eq', 'cancelled');

  const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  // Today's revenue
  const { data: todayRevenueData } = await supabase
    .from('orders')
    .select('total')
    .not('status', 'eq', 'cancelled')
    .gte('created_at', `${today}T00:00:00`);

  const todayRevenue = todayRevenueData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  // Total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Active carts (modified in last 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeCarts } = await supabase
    .from('carts')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', yesterday);

  // Average order value
  const averageOrderValue =
    totalOrders && totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Conversion rate (orders / total users)
  const conversionRate =
    totalUsers && totalUsers > 0 ? ((totalOrders || 0) / totalUsers) * 100 : 0;

  // Additional Executive KPIs
  const todayProfit = todayRevenue * 0.4; // Mocked 40% margin

  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: activeCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: inventoryAlerts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lte('stock', 5);

  const { count: returnsCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'returned');

  const { count: refundsCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'refunded');

  return {
    total_users: totalUsers || 0,
    today_users: todayUsers || 0,
    total_orders: totalOrders || 0,
    today_orders: todayOrders || 0,
    total_revenue: totalRevenue,
    today_revenue: todayRevenue,
    total_products: totalProducts || 0,
    active_carts: activeCarts || 0,
    conversion_rate: parseFloat(conversionRate.toFixed(2)),
    average_order_value: parseFloat(averageOrderValue.toFixed(2)),
    today_profit: todayProfit,
    pending_orders: pendingOrders || 0,
    active_customers: activeCustomers || 0,
    inventory_alerts: inventoryAlerts || 0,
    returns_count: returnsCount || 0,
    refunds_count: refundsCount || 0,
  };
}

/**
 * Get daily sales for the last N days.
 */
export async function getDailySales(days = 30): Promise<DailySales[]> {
  const supabase = await createAdminClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total')
    .not('status', 'eq', 'cancelled')
    .gte('created_at', `${startDate}T00:00:00`)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // Group by date
  const salesByDate: Record<string, DailySales> = {};
  
  data.forEach((order) => {
    const date = order.created_at.split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = { date, revenue: 0, orders: 0 };
    }
    salesByDate[date].revenue += order.total || 0;
    salesByDate[date].orders += 1;
  });

  // Fill in missing dates with 0
  const result: DailySales[] = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    result.push(
      salesByDate[date] || { date, revenue: 0, orders: 0 }
    );
  }

  return result;
}

/**
 * Get top selling products.
 */
export async function getTopProducts(limit = 10): Promise<
  Array<{ product_id: string; name: string; total_sold: number; revenue: number }>
> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('order_items')
    .select(
      `
      product_id,
      quantity,
      total_price,
      product:products(name)
    `
    )
    .order('total_price', { ascending: false });

  if (error || !data) return [];

  // Aggregate by product
  const productMap: Record<
    string,
    { name: string; total_sold: number; revenue: number }
  > = {};

  data.forEach((item: any) => {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = {
        name: item.product?.name || 'Unknown',
        total_sold: 0,
        revenue: 0,
      };
    }
    productMap[item.product_id].total_sold += item.quantity;
    productMap[item.product_id].revenue += item.total_price;
  });

  return Object.entries(productMap)
    .map(([product_id, stats]) => ({ product_id, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Get low stock items for dashboard widget.
 */
export async function getLowStockItems(limit = 6): Promise<Array<{ id: string; name: string; stock: number; is_variant: boolean }>> {
  const supabase = await createAdminClient();
  
  // Base products low stock
  const { data: baseProducts } = await supabase
    .from('products')
    .select('id, name, stock')
    .eq('is_active', true)
    .lte('stock', 5)
    .order('stock', { ascending: true })
    .limit(limit);

  // Poster sizes (variants) low stock
  const { data: variants } = await supabase
    .from('poster_sizes')
    .select('id, size_name, stock, product_id, product:products(name)')
    .lte('stock', 5)
    .order('stock', { ascending: true })
    .limit(limit);

  const combined = [
    ...(baseProducts || []).map(p => ({ id: p.id, name: p.name, stock: p.stock, is_variant: false })),
    ...(variants || []).filter(v => v.product).map(v => ({ 
      id: v.id, 
      name: `${(v.product as any)?.name} - ${v.size_name}`, 
      stock: v.stock, 
      is_variant: true 
    }))
  ];

  return combined.sort((a, b) => a.stock - b.stock).slice(0, limit);
}

/**
 * Get device analytics.
 */
export async function getDeviceAnalytics(): Promise<
  Array<{ device: string; count: number }>
> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('login_logs')
    .select('device');

  if (error || !data) return [];

  const deviceCount: Record<string, number> = {};
  data.forEach((log) => {
    const device = log.device || 'Unknown';
    deviceCount[device] = (deviceCount[device] || 0) + 1;
  });

  return Object.entries(deviceCount).map(([device, count]) => ({
    device,
    count,
  }));
}
