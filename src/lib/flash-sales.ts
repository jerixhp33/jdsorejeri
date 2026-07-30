import { createPublicClient } from './supabase/server';
import type { FlashSale, FlashSaleProduct, Product } from '@/types';

export interface ActiveFlashSale extends FlashSale {
  products: FlashSaleProduct[];
}

/**
 * Fetch the currently active flash sale (if any).
 * A flash sale is active if is_active is true, and the current time is between start_at and end_at.
 */
export async function getActiveFlashSale(): Promise<ActiveFlashSale | null> {
  const supabase = createPublicClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flash_sales')
    .select(`
      *,
      products:flash_sale_products(
        id, flash_sale_id, product_id
      )
    `)
    .eq('is_active', true)
    .lte('start_at', now)
    .gt('end_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as ActiveFlashSale;
}

/**
 * Helper to calculate the discounted price
 */
export function calculateFlashSalePrice(originalPrice: number, discountPercentage: number): number {
  return Math.round(originalPrice * (1 - discountPercentage / 100));
}
