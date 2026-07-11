import { describe, it, expect } from 'vitest';
import { FinanceAnalyticsService } from '@/lib/finance-analytics';

describe('FinanceAnalyticsService', () => {
  describe('calculate()', () => {
    it('calculates gross revenue and profit properly for delivered orders', () => {
      const orders = [
        { status: 'delivered', subtotal: 1000, shipping_fee: 100, discount_amount: 100, tax: 0, grand_total: 1000 },
        { status: 'delivered', subtotal: 2000, shipping_fee: 0, discount_amount: 0, tax: 0, grand_total: 2000 }, // free shipping -> 100 expense
      ];
      
      const result = FinanceAnalyticsService.calculate(orders as any);
      
      expect(result.grossRevenue).toBe(3000);
      expect(result.discounts).toBe(100);
      expect(result.shippingIncome).toBe(100);
      expect(result.shippingExpense).toBe(190); // 100 * 0.9 = 90. 0 shipping = 100. Total = 190.
      expect(result.netRevenue).toBe(3000 - 100 + 100); // 3000 net
      expect(result.estimatedProfit).toBe(3000 - (3000 * 0.6) - 190 - 0); // 3000 - 1800 - 190 = 1010
    });

    it('ignores cancelled orders completely', () => {
      const orders = [
        { status: 'cancelled', subtotal: 5000, shipping_fee: 0, discount_amount: 0, tax: 0, grand_total: 5000 }
      ];
      
      const result = FinanceAnalyticsService.calculate(orders as any);
      
      expect(result.grossRevenue).toBe(0);
      expect(result.netRevenue).toBe(0);
    });

    it('adds refunded orders to refunds and deducts from net revenue', () => {
      const orders = [
        { status: 'delivered', subtotal: 1000, shipping_fee: 100, discount_amount: 0, tax: 0, grand_total: 1100 },
        { status: 'refunded', subtotal: 2000, shipping_fee: 0, discount_amount: 0, tax: 0, grand_total: 2000 }, 
      ];
      
      const result = FinanceAnalyticsService.calculate(orders as any);
      
      expect(result.grossRevenue).toBe(1000); // only delivered adds to gross
      expect(result.refunds).toBe(2000);
      expect(result.netRevenue).toBe(1000 - 0 + 100 - 2000); // -900 net revenue
    });
  });
});
