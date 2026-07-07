'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { calculateDeliveryCharge } from '@/lib/utils';
import type { Cart, CartItem } from '@/types';
import { toast } from 'sonner';

const CART_UPDATED_EVENT = 'CART_UPDATED';
const dispatchCartUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
};

interface CartState {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  loading: boolean;
  addItem: (
    productId: string,
    unitPrice: number,
    quantity?: number,
    posterSizeId?: string
  ) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCart(): CartState {
  const { profile } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  // Create supabase client once per component instance to prevent
  // a new client on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  
  const [deliverySettings, setDeliverySettings] = useState({ charge: 60, threshold: 999 });

  const fetchCart = useCallback(async () => {
    if (!profile) {
      setCart(null);
      return;
    }

    setLoading(true);
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
        setCart(null);
        return;
      }

      // Fetch items
      const { data: items } = await supabase
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

      setCart({
        ...cartData,
        items: (items as CartItem[]) || [],
      });

      // Fetch delivery settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['delivery_charge', 'free_delivery_threshold']);

      if (settingsData) {
        const chargeStr = settingsData.find(s => s.key === 'delivery_charge')?.value;
        const thresholdStr = settingsData.find(s => s.key === 'free_delivery_threshold')?.value;
        setDeliverySettings({
          charge: chargeStr ? parseInt(String(chargeStr).replace(/"/g, ''), 10) : 60,
          threshold: thresholdStr ? parseInt(String(thresholdStr).replace(/"/g, ''), 10) : 999,
        });
      }

    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchCart();
    
    // Listen for cart updates from other component instances
    const handleCartUpdate = () => {
      fetchCart();
    };
    
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
  }, [fetchCart]);

  // No realtime subscription here — every mutation calls fetchCart() locally,
  // and then dispatches CART_UPDATED_EVENT so other components sync up.

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
      // Ensure we have a cart
      let cartId = cart?.id;
      if (!cartId) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: profile.id })
          .select()
          .single();
        cartId = newCart?.id;
      }

      if (!cartId) throw new Error('Could not create cart');

      // Fetch current stock for this product/size
      let availableStock = 0;
      if (posterSizeId) {
        const { data: sizeData } = await supabase
          .from('poster_sizes')
          .select('stock')
          .eq('id', posterSizeId)
          .single();
        availableStock = sizeData?.stock ?? 0;
      } else {
        const { data: productData } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();
        availableStock = productData?.stock ?? 0;
      }

      // Check for existing item
      let existingQuery = supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId);

      if (posterSizeId) {
        existingQuery = existingQuery.eq('poster_size_id', posterSizeId);
      } else {
        existingQuery = existingQuery.is('poster_size_id', null);
      }

      const { data: existing } = await existingQuery.single();

      const currentCartQty = existing?.quantity ?? 0;
      const newQty = currentCartQty + quantity;

      if (newQty > availableStock) {
        const remaining = availableStock - currentCartQty;
        if (remaining <= 0) {
          toast.error(`You already have the maximum stock in your cart (${availableStock})`);
        } else {
          toast.error(`Only ${remaining} more available — you already have ${currentCartQty} in cart`);
        }
        return;
      }

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: productId,
          poster_size_id: posterSizeId || null,
          quantity,
          unit_price: unitPrice,
        });
      }

      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cartId);

      await fetchCart();
      dispatchCartUpdate();
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
      console.error(err);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(cartItemId);
    }

    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
    await fetchCart();
    dispatchCartUpdate();
  };

  const removeItem = async (cartItemId: string) => {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    await fetchCart();
    dispatchCartUpdate();
    toast.success('Removed from cart');
  };

  const clearCartItems = async () => {
    if (!cart?.id) return;
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    await fetchCart();
    dispatchCartUpdate();
  };

  const items = cart?.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
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
    addItem,
    updateQuantity,
    removeItem,
    clearCart: clearCartItems,
    refresh: fetchCart,
  };
}