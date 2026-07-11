import { describe, it, expect } from 'vitest';
import { CustomerAnalyticsService } from '@/lib/customer-analytics';

describe('CustomerAnalyticsService', () => {
  describe('calculate()', () => {
    it('calculates metrics for a new customer with one order', () => {
      const orders = [
        { id: '1', status: 'delivered', grand_total: 1500, created_at: new Date().toISOString() }
      ];

      const result = CustomerAnalyticsService.calculate(orders as any);

      expect(result.totalOrders).toBe(1);
      expect(result.lifetimeValue).toBe(1500);
      expect(result.averageOrderValue).toBe(1500);
      expect(result.returnRate).toBe(0);
      expect(result.segment).toBe('New');
    });

    it('calculates metrics for a VIP customer', () => {
      const orders = [
        { id: '1', status: 'delivered', grand_total: 6000, created_at: new Date().toISOString() },
        { id: '2', status: 'delivered', grand_total: 5000, created_at: new Date().toISOString() },
        { id: '3', status: 'delivered', grand_total: 4500, created_at: new Date().toISOString() },
        { id: '4', status: 'delivered', grand_total: 4500, created_at: new Date().toISOString() },
        { id: '5', status: 'delivered', grand_total: 4500, created_at: new Date().toISOString() }
      ];

      const result = CustomerAnalyticsService.calculate(orders as any);

      expect(result.totalOrders).toBe(5);
      expect(result.lifetimeValue).toBe(24500);
      expect(result.segment).toBe('VIP'); // >= 5 orders is VIP
    });

    it('correctly handles returns in return rate', () => {
      const orders = [
        { id: '1', status: 'delivered', grand_total: 1000, created_at: new Date().toISOString() },
        { id: '2', status: 'returned', grand_total: 1000, created_at: new Date().toISOString() }
      ];

      const result = CustomerAnalyticsService.calculate(orders as any);

      expect(result.totalOrders).toBe(2); 
      expect(result.lifetimeValue).toBe(1000);
      expect(result.returnRate).toBe(50); // 1 out of 2 total actual placed orders
    });
  });
});
