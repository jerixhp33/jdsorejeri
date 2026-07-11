import { describe, it, expect } from 'vitest';
import { InventoryAnalyticsService } from '@/lib/inventory-analytics';

describe('InventoryAnalyticsService', () => {
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  describe('calculate()', () => {
    it('calculates out-of-stock and low-stock properly', () => {
      const products = [
        { id: '1', name: 'Product A', stock: 0, price: 100 },
        { id: '2', name: 'Product B', stock: 3, price: 100 },
        { id: '3', name: 'Product C', stock: 20, price: 100 },
      ];
      
      const result = InventoryAnalyticsService.calculate(products, [], thirtyDaysAgoIso);
      
      expect(result.outOfStockCount).toBe(1);
      expect(result.lowStockCount).toBe(1);
      expect(result.totalProducts).toBe(3);
    });

    it('identifies dead stock when no sales in 90 days', () => {
      const products = [
        { id: '1', name: 'Product A', stock: 10, price: 100 }, // Has sales
        { id: '2', name: 'Product B', stock: 10, price: 100 }, // Dead
      ];
      
      const sales = [
        { product_id: '1', quantity: 2, created_at: thirtyDaysAgoIso, order: { status: 'delivered' } }
      ];
      
      const result = InventoryAnalyticsService.calculate(products, sales, thirtyDaysAgoIso);
      
      expect(result.deadStockCount).toBe(1);
    });

    it('generates restock recommendations when days of inventory < 14', () => {
      const products = [
        { id: '1', name: 'Product Fast', stock: 10, price: 100 }, // Selling 30 in 30 days = 1/day -> 10 days left
        { id: '2', name: 'Product Slow', stock: 50, price: 100 }, // Selling 5 in 30 days -> lots left
      ];
      
      const sales = [
        { product_id: '1', quantity: 30, created_at: thirtyDaysAgoIso, order: { status: 'delivered' } },
        { product_id: '2', quantity: 5, created_at: thirtyDaysAgoIso, order: { status: 'delivered' } }
      ];
      
      const result = InventoryAnalyticsService.calculate(products, sales, thirtyDaysAgoIso);
      
      expect(result.restockRecommendations).toHaveLength(1);
      expect(result.restockRecommendations[0].id).toBe('1');
      expect(result.restockRecommendations[0].suggestedRestock).toBe(45); // 1.5x 30d sales
    });
  });
});
