import type { Order } from '@/types';

export type CustomerSegment = 'New' | 'Returning' | 'VIP' | 'High Value' | 'At Risk' | 'Dormant';

export interface CustomerAnalytics {
  totalOrders: number;
  lifetimeValue: number;
  averageOrderValue: number;
  returnRate: number;
  cancellationRate: number;
  segment: CustomerSegment;
  lastOrderDate: Date | null;
  favoriteCategory: string | null;
  favoritePaymentMethod: string | null;
  avgDeliveryTimeDays: number | null;
}

export class CustomerAnalyticsService {
  /**
   * Calculates comprehensive analytics for a customer based on their complete order history.
   * Does not require database persistence, meaning it will never become stale.
   */
  static calculate(orders: any[] = []): CustomerAnalytics {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        lifetimeValue: 0,
        averageOrderValue: 0,
        returnRate: 0,
        cancellationRate: 0,
        segment: 'Dormant',
        lastOrderDate: null,
        favoriteCategory: null,
        favoritePaymentMethod: null,
        avgDeliveryTimeDays: null
      };
    }

    const totalOrders = orders.length;
    let lifetimeValue = 0;
    let returns = 0;
    let cancellations = 0;
    
    let lastOrderDate: Date | null = null;
    let paymentMethods: Record<string, number> = {};
    let categories: Record<string, number> = {};

    let totalDeliveryDays = 0;
    let deliveredCount = 0;

    orders.forEach(order => {
      // Basic metrics
      if (order.status === 'delivered') {
        lifetimeValue += (order.grand_total || 0);
      }
      
      if (order.status === 'returned' || order.fulfillment_status === 'returned') returns++;
      if (order.status === 'cancelled') cancellations++;

      // Recency
      const orderDate = new Date(order.created_at);
      if (!lastOrderDate || orderDate > lastOrderDate) {
        lastOrderDate = orderDate;
      }

      // Payment Preference
      if (order.payment_method) {
        paymentMethods[order.payment_method] = (paymentMethods[order.payment_method] || 0) + 1;
      }

      // Categories (assuming order_items are joined and have products.category_id)
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          if (item.product?.category_id) {
             categories[item.product.category_id] = (categories[item.product.category_id] || 0) + 1;
          }
        });
      }

      // Delivery Time (assuming order_events timeline exists, but we'll approximate with updated_at if delivered)
      if (order.status === 'delivered' && order.updated_at) {
         const days = (new Date(order.updated_at).getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
         if (days > 0) {
           totalDeliveryDays += days;
           deliveredCount++;
         }
      }
    });

    const averageOrderValue = lifetimeValue > 0 ? lifetimeValue / (totalOrders - cancellations - returns) : 0;
    const returnRate = (returns / totalOrders) * 100;
    const cancellationRate = (cancellations / totalOrders) * 100;
    const avgDeliveryTimeDays = deliveredCount > 0 ? totalDeliveryDays / deliveredCount : null;

    // Segment Logic
    let segment: CustomerSegment = 'New';
    const daysSinceLastOrder = lastOrderDate ? (Date.now() - (lastOrderDate as Date).getTime()) / (1000 * 3600 * 24) : Infinity;

    if (totalOrders >= 5 || lifetimeValue > 50000) segment = 'VIP';
    else if (lifetimeValue > 20000) segment = 'High Value';
    else if (totalOrders >= 2 && daysSinceLastOrder <= 90) segment = 'Returning';
    else if (totalOrders >= 2 && daysSinceLastOrder > 90) segment = 'At Risk';
    else if (daysSinceLastOrder > 180) segment = 'Dormant';

    // Favorites
    const favoritePaymentMethod = Object.keys(paymentMethods).sort((a, b) => paymentMethods[b] - paymentMethods[a])[0] || null;
    const favoriteCategory = Object.keys(categories).sort((a, b) => categories[b] - categories[a])[0] || null;

    return {
      totalOrders,
      lifetimeValue,
      averageOrderValue,
      returnRate,
      cancellationRate,
      segment,
      lastOrderDate,
      favoriteCategory,
      favoritePaymentMethod,
      avgDeliveryTimeDays
    };
  }

  /**
   * Calculates global distribution metrics for the Analytics module
   */
  static async getGlobalDistribution(customers: any[]) {
    let newCustomers = 0;
    let returningCustomers = 0;
    
    const segmentMap: Record<string, number> = {};
    const tierMap: Record<string, number> = {};

    customers.forEach(c => {
       const analytics = this.calculate(c.orders);
       
       segmentMap[analytics.segment] = (segmentMap[analytics.segment] || 0) + 1;
       tierMap[c.membership_tier || 'bronze'] = (tierMap[c.membership_tier || 'bronze'] || 0) + 1;

       if (analytics.totalOrders > 1) returningCustomers++;
       else newCustomers++;
    });

    return {
      segmentDistribution: Object.entries(segmentMap).map(([name, value]) => ({ name, value })),
      tierDistribution: Object.entries(tierMap).map(([name, value]) => ({ name, value })),
      returningRate: customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0
    };
  }
}
