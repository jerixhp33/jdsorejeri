'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order } from '@/types';

// Single shared client — stable across re-renders
const supabase = createClient();

export function useOrderRealtime(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : (payload.new as Order)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order };
}
