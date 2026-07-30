'use client';

import { useState, useEffect } from 'react';
import type { ActiveFlashSale } from '@/lib/flash-sales';

export function useFlashSale() {
  const [activeSale, setActiveSale] = useState<ActiveFlashSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSale() {
      try {
        // Only fetch once per session or use SWR. For simplicity, we just fetch on mount.
        const res = await fetch('/api/flash-sales/active');
        if (res.ok) {
          const data = await res.json();
          // Verify end time
          if (data && new Date(data.end_at).getTime() > Date.now()) {
            setActiveSale(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch flash sale', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSale();
  }, []);

  const getProductSalePrice = (productId: string, originalPrice: number) => {
    if (!activeSale || new Date(activeSale.end_at).getTime() <= Date.now()) return null;
    
    const isIncluded = activeSale.products.some(p => p.product_id === productId);
    if (!isIncluded) return null;

    return Math.round(originalPrice * (1 - activeSale.discount_percentage / 100));
  };

  return { activeSale, loading, getProductSalePrice };
}
