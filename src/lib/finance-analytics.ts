import { createAdminClient } from '@/lib/supabase/server';

export class FinanceAnalyticsService {
  static calculate(orders: any[]) {
    let grossRevenue = 0;
    let discounts = 0;
    let shippingIncome = 0;
    let shippingExpense = 0;
    let taxes = 0;
    let refunds = 0;
    let totalCogs = 0;
    let paymentGatewayFees = 0;
    
    if (orders) {
      orders.forEach(o => {
        if (o.status === 'cancelled') return;
        
        const subtotal = o.subtotal || 0;
        const ship = o.shipping_fee || 0; // What we charged the customer
        const tax = o.tax || 0;
        const discount = o.discount_amount || 0;
        const grandTotal = o.grand_total || 0;
        const cogs = o.order_items?.reduce((sum: number, item: any) => sum + (item.total_cost || 0), 0) || 0;

        if (o.status === 'refunded' || o.status === 'returned') {
          refunds += grandTotal;
        } else {
          grossRevenue += subtotal;
          discounts += discount;
          shippingIncome += ship;
          taxes += tax;
          totalCogs += cogs;
          
          // Actual shipping cost if logged, else fallback estimate
          shippingExpense += o.shipping_cost || (ship === 0 ? 100 : ship * 0.9);
          // Assuming 2% gateway fee
          paymentGatewayFees += grandTotal * 0.02;
        }
      });
    }

    const netRevenue = grossRevenue - discounts + shippingIncome - refunds;
    
    // True Net Profit
    const netProfit = netRevenue - totalCogs - shippingExpense - taxes - paymentGatewayFees;

    return {
      grossRevenue,
      discounts,
      shippingIncome,
      shippingExpense,
      taxes,
      refunds,
      totalCogs,
      paymentGatewayFees,
      netRevenue,
      netProfit,
      grossMarginPct: netRevenue > 0 ? ((netRevenue - totalCogs) / netRevenue) * 100 : 0,
      netMarginPct: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0
    };
  }
}

export async function getFinanceAnalytics(days = 30) {
  const supabase = await createAdminClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select('status, subtotal, shipping_fee, tax, discount_amount, total, grand_total, shipping_cost, order_items(total_cost)')
    .gte('created_at', startDate);

  return FinanceAnalyticsService.calculate(orders || []);
}

export async function getProductPerformanceMatrix(days = 30) {
  const supabase = await createAdminClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get all order items from the period (excluding cancelled/refunded)
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      price,
      total_cost,
      order:orders!inner(status, created_at),
      product:products(name, category_id)
    `)
    .gte('order.created_at', startDate)
    .neq('order.status', 'cancelled')
    .neq('order.status', 'refunded');

  if (!orderItems) return [];

  const performanceMap: Record<string, any> = {};

  orderItems.forEach((item: any) => {
    const pId = item.product_id;
    if (!performanceMap[pId]) {
      performanceMap[pId] = {
        id: pId,
        name: item.product?.name || 'Unknown',
        volumeSold: 0,
        grossRevenue: 0,
        totalCogs: 0
      };
    }
    performanceMap[pId].volumeSold += item.quantity;
    performanceMap[pId].grossRevenue += (item.price * item.quantity);
    performanceMap[pId].totalCogs += (item.total_cost || 0);
  });

  return Object.values(performanceMap).map((p: any) => {
    const grossProfit = p.grossRevenue - p.totalCogs;
    const netMarginPct = p.grossRevenue > 0 ? (grossProfit / p.grossRevenue) * 100 : 0;
    let classification = 'Average';
    if (p.volumeSold > 10 && netMarginPct > 40) classification = 'Cash Cow';
    else if (p.volumeSold <= 5 && netMarginPct < 20) classification = 'Dead Weight';
    else if (p.volumeSold > 10 && netMarginPct < 20) classification = 'Volume / Low Margin';
    else if (p.volumeSold <= 5 && netMarginPct >= 40) classification = 'Niche / High Margin';

    return { ...p, grossProfit, netMarginPct, classification };
  }).sort((a, b) => b.grossProfit - a.grossProfit);
}
