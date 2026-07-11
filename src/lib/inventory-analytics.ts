import { createAdminClient } from '@/lib/supabase/server';

export interface InventoryAnalytics {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  deadStockCount: number;
  fastMovingCount: number;
  restockRecommendations: any[];
  categoryDistribution: any[];
}

export class InventoryAnalyticsService {
  static calculate(products: any[], recentSales: any[], thirtyDaysAgoIso: string) {
    const productSales90d: Record<string, number> = {};
    const productSales30d: Record<string, number> = {};
    
    if (recentSales) {
      recentSales.forEach(item => {
        // Filter cancelled
        if (item.order && (item.order as any).status === 'cancelled') return;
        
        productSales90d[item.product_id] = (productSales90d[item.product_id] || 0) + item.quantity;
        if (item.created_at >= thirtyDaysAgoIso) {
          productSales30d[item.product_id] = (productSales30d[item.product_id] || 0) + item.quantity;
        }
      });
    }

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let deadStockCount = 0;
    let fastMovingCount = 0;
    
    const restockRecommendations: any[] = [];
    const categoryMap: Record<string, { name: string; value: number; count: number }> = {};

    products.forEach(p => {
      const stock = p.stock || 0;
      const val = stock * (p.price || 0);
      totalValue += val;

      const catName = (p.category as any)?.name || 'Uncategorized';
      if (!categoryMap[catName]) categoryMap[catName] = { name: catName, value: 0, count: 0 };
      categoryMap[catName].value += val;
      categoryMap[catName].count += 1;

      if (stock === 0) outOfStockCount++;
      else if (stock <= 5) lowStockCount++;

      const sold90d = productSales90d[p.id] || 0;
      const sold30d = productSales30d[p.id] || 0;

      if (sold90d === 0 && stock > 0) {
        deadStockCount++;
      }

      if (sold30d > 10) {
        fastMovingCount++;
      }

      // Recommendation logic: If selling fast and stock is low, restock!
      if (sold30d > 0) {
        const daysOfInventory = (stock / sold30d) * 30; // velocity
        if (daysOfInventory < 14) {
          restockRecommendations.push({
            id: p.id,
            name: p.name,
            stock,
            velocity30d: sold30d,
            daysRemaining: daysOfInventory,
            suggestedRestock: Math.ceil(sold30d * 1.5) // Suggest 45 days worth
          });
        }
      }
    });

    return {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      deadStockCount,
      fastMovingCount,
      restockRecommendations: restockRecommendations.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 10),
      categoryDistribution: Object.values(categoryMap).sort((a, b) => b.value - a.value)
    };
  }
}

export async function getInventoryAnalytics(): Promise<InventoryAnalytics> {
  const supabase = await createAdminClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock, price, category_id, is_active, category:categories(name)')
    .eq('is_active', true);

  if (!products) {
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      deadStockCount: 0,
      fastMovingCount: 0,
      restockRecommendations: [],
      categoryDistribution: []
    };
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get sales data for velocity and dead stock checks
  const { data: recentSales } = await supabase
    .from('order_items')
    .select('product_id, quantity, created_at, order:orders(status)')
    .gte('created_at', ninetyDaysAgo);

  return InventoryAnalyticsService.calculate(products, recentSales || [], thirtyDaysAgo);
}
