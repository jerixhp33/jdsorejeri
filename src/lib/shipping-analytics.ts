import { createAdminClient } from '@/lib/supabase/server';



export class ShippingAnalyticsService {
  static calculate(shipments: any[], totalOrders: number, returnedOrders: number) {
    let totalFulfillmentTime = 0;
    let fulfilledCount = 0;
    
    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    let failedDeliveries = 0;
    let returnDeliveries = 0;

    const courierMap: Record<string, { total: number; delivered: number; failed: number }> = {};

    if (shipments) {
      shipments.forEach(s => {
        const provider = s.provider || 'manual';
        if (!courierMap[provider]) {
          courierMap[provider] = { total: 0, delivered: 0, failed: 0 };
        }
        courierMap[provider].total++;

        // Fulfillment time (Time from order creation to shipment creation)
        if (s.order && (s.order as any).created_at) {
          const orderDate = new Date((s.order as any).created_at).getTime();
          const shipDate = new Date(s.created_at).getTime();
          totalFulfillmentTime += (shipDate - orderDate) / (1000 * 3600 * 24);
          fulfilledCount++;
        }

        // Delivery time (Time from shipment creation to delivered status)
        if (s.status === 'delivered') {
          courierMap[provider].delivered++;
          const shipDate = new Date(s.created_at).getTime();
          const updatedDate = new Date(s.updated_at).getTime();
          totalDeliveryTime += (updatedDate - shipDate) / (1000 * 3600 * 24);
          deliveredCount++;
        } else if (s.status === 'failed_delivery') {
          courierMap[provider].failed++;
          failedDeliveries++;
        } else if (s.status === 'returned') {
          returnDeliveries++;
        }
      });
    }

    return {
      avgFulfillmentDays: fulfilledCount > 0 ? (totalFulfillmentTime / fulfilledCount) : 0,
      avgDeliveryDays: deliveredCount > 0 ? (totalDeliveryTime / deliveredCount) : 0,
      failedDeliveries,
      returnRate: totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0,
      shippingCostPerOrder: 150, // Mocked for now (flat 150 Rs typically)
      courierPerformance: Object.entries(courierMap).map(([name, stats]) => ({
        name,
        ...stats,
        successRate: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0
      }))
    };
  }
}

export async function getShippingAnalytics() {
  const supabase = await createAdminClient();

  const { data: shipments } = await supabase
    .from('shipments')
    .select('*, order:orders(created_at)');

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: returnedOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'returned');

  return ShippingAnalyticsService.calculate(shipments || [], totalOrders || 0, returnedOrders || 0);
}
