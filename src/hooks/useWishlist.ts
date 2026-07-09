'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { WishlistItem } from '@/types';
import { toast } from 'sonner';

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWishlist(): WishlistState {
  const { profile } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchWishlist = useCallback(async () => {
    if (!profile) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('wishlists')
        .select(
          `
          *,
          product:products(
            *,
            category:product_categories(id, name),
            images:product_images(url, is_primary, display_order),
            sizes:poster_sizes(*)
          )
        `
        )
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setItems((data as WishlistItem[]) || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isWishlisted = (productId: string): boolean => {
    return items.some((item) => item.product_id === productId);
  };

  const toggle = async (productId: string) => {
    if (!profile) {
      toast.error('Please sign in to save items');
      return;
    }

    const existing = items.find((item) => item.product_id === productId);

    if (existing) {
      await supabase.from('wishlists').delete().eq('id', existing.id);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } else {
      const { data } = await supabase
        .from('wishlists')
        .insert({ user_id: profile.id, product_id: productId })
        .select()
        .single();

      if (data) {
        setItems((prev) => [data as WishlistItem, ...prev]);
        toast.success('Added to wishlist');
      }
    }
  };

  const remove = async (productId: string) => {
    if (!profile) return;

    const existing = items.find((item) => item.product_id === productId);
    if (!existing) return;

    await supabase.from('wishlists').delete().eq('id', existing.id);
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  return {
    items,
    loading,
    isWishlisted,
    toggle,
    remove,
    refresh: fetchWishlist,
  };
}
