'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Cart, CartItem } from '@/types';
import { toast } from 'sonner';
import { create } from 'zustand';

interface GlobalCartState {
  cart: Cart | null;
  items: CartItem[];
  deliverySettings: { charge: number; threshold: number };
  loading: boolean;
  hasFetched: boolean;
  setCartData: (cart: Cart | null, items: CartItem[], settings?: { charge: number; threshold: number }) => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: (fetched: boolean) => void;
  updateLocalQuantity: (cartItemId: string, quantity: number) => void;
  removeLocalItem: (cartItemId: string) => void;
  addLocalItem: (item: CartItem) => void;
}

const useCartStore = create<GlobalCartState>((set) => ({
  cart: null,
  items: [],
  deliverySettings: { charge: 60, threshold: 999 },
  loading: true,
  hasFetched: false,
  setCartData: (cart, items, settings) => set((state) => ({
    cart,
    items,
    ...(settings ? { deliverySettings: settings } : {})
  })),
  setLoading: (loading) => set({ loading }),
  setHasFetched: (hasFetched) => set({ hasFetched }),
  updateLocalQuantity: (cartItemId, quantity) => set((state) => ({
    items: state.items.map(i => i.id === cartItemId ? { ...i, quantity } : i)
  })),
  removeLocalItem: (cartItemId) => set((state) => ({
    items: state.items.filter(i => i.id !== cartItemId)
  })),
  addLocalItem: (item) => set((state) => {
    const exists = state.items.find(i => i.id === item.id);
    if (exists) {
      return { items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i) };
    }
    return { items: [...state.items, item] };
  }),
}));

export function useCart() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { 
    cart, 
    items, 
    deliverySettings, 
    loading, 
    hasFetched,
    setCartData, 
    setLoading, 
    setHasFetched,
    updateLocalQuantity, 
    removeLocalItem,
    addLocalItem
  } = useCartStore();
  
  const supabase = createClient();

  const fetchCart = useCallback(async () => {
    if (!profile) {
      setCartData(null, []);
      setLoading(false);
      return;
    }

    try {
      // Get or create cart
      let { data: cartData } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (!cartData) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: profile.id })
          .select()
          .single();
        cartData = newCart;
      }

      if (!cartData) {
        setCartData(null, []);
        return;
      }

      // Fetch items
      const { data: fetchedItems } = await supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(
            id, name, slug, product_type, stock,
            images:product_images(url, is_primary, display_order)
          ),
          poster_size:poster_sizes(*)
        `
        )
        .eq('cart_id', cartData.id)
        .order('created_at', { ascending: true });

      // Fetch delivery settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['delivery_charge', 'free_delivery_threshold']);

      let settings = { charge: 60, threshold: 999 };
      if (settingsData) {
        const chargeStr = settingsData.find(s => s.key === 'delivery_charge')?.value;
        const thresholdStr = settingsData.find(s => s.key === 'free_delivery_threshold')?.value;
        settings = {
          charge: chargeStr ? parseInt(String(chargeStr).replace(/"/g, ''), 10) : 60,
          threshold: thresholdStr ? parseInt(String(thresholdStr).replace(/"/g, ''), 10) : 999,
        };
      }

      setCartData(cartData, (fetchedItems as CartItem[]) || [], settings);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [profile, supabase, setCartData, setLoading, setHasFetched]);

  useEffect(() => {
    // Only fetch on mount if we haven't fetched yet or if profile changes
    if (profile && !hasFetched) {
      fetchCart();
    } else if (!profile && loading) {
      setLoading(false);
    }
  }, [profile, hasFetched, fetchCart, loading, setLoading]);

  const addItem = async (
    productId: string,
    unitPrice: number,
    quantity = 1,
    posterSizeId?: string
  ) => {
    if (!profile) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    try {
      let cartId = cart?.id;
      if (!cartId) {
        const { data: newCart } = await supabase.from('carts').insert({ user_id: profile.id }).select().single();
        cartId = newCart?.id;
      }
      if (!cartId) throw new Error('Could not create cart');

      let availableStock = 0;
      if (posterSizeId) {
        const { data: sizeData } = await supabase.from('poster_sizes').select('stock').eq('id', posterSizeId).single();
        availableStock = sizeData?.stock ?? 0;
      } else {
        const { data: productData } = await supabase.from('products').select('stock').eq('id', productId).single();
        availableStock = productData?.stock ?? 0;
      }

      let existingQuery = supabase.from('cart_items').select('*').eq('cart_id', cartId).eq('product_id', productId);
      if (posterSizeId) {
        existingQuery = existingQuery.eq('poster_size_id', posterSizeId);
      } else {
        existingQuery = existingQuery.is('poster_size_id', null);
      }
      const { data: existing } = await existingQuery.single();

      const currentCartQty = existing?.quantity ?? 0;
      const newQty = currentCartQty + quantity;

      if (newQty > availableStock) {
        toast.error(`Cannot add more. Max stock available: ${availableStock}`);
        return;
      }

      // Optimistic visual update (number increments instantly)
      if (existing) {
        updateLocalQuantity(existing.id, newQty);
        await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
      } else {
        // Optimistic temporary item
        const tempId = 'temp-' + Date.now();
        addLocalItem({ id: tempId, cart_id: cartId, product_id: productId, quantity, unit_price: unitPrice, poster_size_id: posterSizeId || null } as any);
        await supabase.from('cart_items').insert({ cart_id: cartId, product_id: productId, poster_size_id: posterSizeId || null, quantity, unit_price: unitPrice });
      }

      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);
      
      // Re-sync background silently
      fetchCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
      console.error(err);
      fetchCart(); // Revert optimistic changes on error
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(cartItemId);
    updateLocalQuantity(cartItemId, quantity);
    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
    fetchCart();
  };

  const removeItem = async (cartItemId: string) => {
    removeLocalItem(cartItemId);
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    fetchCart();
    toast.success('Removed from cart');
  };

  const clearCartItems = async () => {
    if (!cart?.id) return;
    setCartData(cart, []);
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    fetchCart();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const deliveryCharge = subtotal >= deliverySettings.threshold ? 0 : deliverySettings.charge;
  const total = subtotal + deliveryCharge;

  return {
    cart,
    items,
    itemCount,
    subtotal,
    deliveryCharge,
    total,
    loading,
    deliverySettings,
    addItem,
    updateQuantity,
    removeItem,
    clearCart: clearCartItems,
    refresh: fetchCart,
  };
}