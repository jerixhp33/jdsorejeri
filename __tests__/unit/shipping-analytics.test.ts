import { describe, it, expect } from 'vitest';
import { ShippingAnalyticsService } from '@/lib/shipping-analytics';

describe('ShippingAnalyticsService', () => {
  describe('calculate()', () => {
    it('calculates average fulfillment and delivery times accurately', () => {
      const shipments = [
        { 
          provider: 'Delhivery', 
          status: 'delivered', 
          created_at: new Date('2024-01-02').toISOString(), // 1 day to fulfill
          updated_at: new Date('2024-01-05').toISOString(), // 3 days to deliver
          order: { created_at: new Date('2024-01-01').toISOString() }
        }
      ];

      const result = ShippingAnalyticsService.calculate(shipments as any, 100, 2);

      expect(result.avgFulfillmentDays).toBe(1);
      expect(result.avgDeliveryDays).toBe(3);
      expect(result.returnRate).toBe(2);
      expect(result.courierPerformance[0].name).toBe('Delhivery');
      expect(result.courierPerformance[0].successRate).toBe(100);
    });

    it('handles failed and returned deliveries properly', () => {
      const shipments = [
        { 
          provider: 'STCourier', 
          status: 'failed_delivery', 
          created_at: new Date('2024-01-02').toISOString(),
          updated_at: new Date('2024-01-05').toISOString(),
          order: { created_at: new Date('2024-01-01').toISOString() }
        },
        { 
          provider: 'STCourier', 
          status: 'returned', 
          created_at: new Date('2024-01-02').toISOString(),
          updated_at: new Date('2024-01-05').toISOString(),
          order: { created_at: new Date('2024-01-01').toISOString() }
        }
      ];

      const result = ShippingAnalyticsService.calculate(shipments as any, 100, 1);

      expect(result.failedDeliveries).toBe(1);
      expect(result.courierPerformance[0].total).toBe(2);
      expect(result.courierPerformance[0].delivered).toBe(0);
      expect(result.courierPerformance[0].successRate).toBe(0);
      expect(result.returnRate).toBe(1);
    });
  });
});
