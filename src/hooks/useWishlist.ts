'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const supabase = createClient();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['wishlist', profile?.id];

  // React Query for fetching — automatic caching, deduplication, background refetch
  const { data: items = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey,
    queryFn: async () => {
      if (!profile) return [];
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
      return (data as WishlistItem[]) || [];
    },
    enabled: !!profile,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation for toggle with optimistic update
  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!profile) throw new Error('Not signed in');
      const existing = items.find((item) => item.product_id === productId);
      if (existing) {
        await supabase.from('wishlists').delete().eq('id', existing.id);
        return { action: 'removed' as const, productId };
      } else {
        const { data } = await supabase
          .from('wishlists')
          .insert({ user_id: profile.id, product_id: productId })
          .select()
          .single();
        return { action: 'added' as const, productId, data };
      }
    },
    onMutate: async (productId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      // Snapshot previous value
      const previousItems = queryClient.getQueryData<WishlistItem[]>(queryKey);
      // Optimistic update — instant UI change
      const existing = items.find((item) => item.product_id === productId);
      if (existing) {
        queryClient.setQueryData<WishlistItem[]>(queryKey, (old) =>
          (old || []).filter((item) => item.product_id !== productId)
        );
      }
      return { previousItems };
    },
    onSuccess: (result) => {
      toast.success(result.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
      // Refetch to get full product data for newly added items
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (_err, _productId, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      toast.error('Something went wrong');
    },
  });

  // Mutation for remove
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!profile) return;
      const existing = items.find((item) => item.product_id === productId);
      if (!existing) return;
      await supabase.from('wishlists').delete().eq('id', existing.id);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData<WishlistItem[]>(queryKey);
      queryClient.setQueryData<WishlistItem[]>(queryKey, (old) =>
        (old || []).filter((item) => item.product_id !== productId)
      );
      return { previousItems };
    },
    onSuccess: () => {
      toast.success('Removed from wishlist');
    },
    onError: (_err, _productId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
    },
  });

  const isWishlisted = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.product_id === productId);
    },
    [items]
  );

  const toggle = async (productId: string) => {
    if (!profile) {
      toast.error('Please sign in to save items');
      return;
    }
    toggleMutation.mutate(productId);
  };

  const remove = async (productId: string) => {
    if (!profile) return;
    removeMutation.mutate(productId);
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    items,
    loading: isLoading,
    isWishlisted,
    toggle,
    remove,
    refresh,
  };
}
