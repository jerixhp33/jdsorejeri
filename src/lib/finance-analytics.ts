import { createAdminClient } from '@/lib/supabase/server';



export class FinanceAnalyticsService {
  static calculate(orders: any[]) {
    let grossRevenue = 0;
    let discounts = 0;
    let shippingIncome = 0;
    let shippingExpense = 0;
    let taxes = 0;
    let refunds = 0;
    
    if (orders) {
      orders.forEach(o => {
        if (o.status === 'cancelled') return;
        
        const subtotal = o.subtotal || 0;
        const ship = o.shipping_fee || 0;
        const tax = o.tax || 0;
        const discount = o.discount_amount || 0;
        const grandTotal = o.grand_total || 0;

        if (o.status === 'refunded' || o.status === 'returned') {
          refunds += grandTotal;
        } else {
          grossRevenue += subtotal;
          discounts += discount;
          shippingIncome += ship;
          taxes += tax;
          
          // Mock shipping expense (assume courier costs 90% of what we charge, or fixed cost if free shipping)
          shippingExpense += ship === 0 ? 100 : ship * 0.9;
        }
      });
    }

    const netRevenue = grossRevenue - discounts + shippingIncome - refunds;
    
    // Mock Estimated Profit (assuming 60% COGS + shipping expense)
    const cogs = grossRevenue * 0.6;
    const estimatedProfit = netRevenue - cogs - shippingExpense - taxes;

    return {
      grossRevenue,
      discounts,
      shippingIncome,
      shippingExpense,
      taxes,
      refunds,
      netRevenue,
      estimatedProfit
    };
  }
}

export async function getFinanceAnalytics(days = 30) {
  const supabase = await createAdminClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select('status, subtotal, shipping_fee, tax, discount_amount, total, grand_total')
    .gte('created_at', startDate);

  return FinanceAnalyticsService.calculate(orders || []);
}
