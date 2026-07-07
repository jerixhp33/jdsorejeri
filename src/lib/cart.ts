import { createClient } from '@/lib/supabase/server';
import type { Cart, CartItem } from '@/types';

/**
 * Get or create a cart for the current user.
 */
export async function getOrCreateCart(userId: string): Promise<Cart | null> {
  const supabase = await createClient();

  // Try to get existing cart
  let { data: cart } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Create if doesn't exist
  if (!cart) {
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) return null;
    cart = newCart;
  }

  return cart;
}

/**
 * Get cart with all items for a user.
 */
export async function getCartWithItems(userId: string): Promise<Cart | null> {
  const supabase = await createClient();

  const { data: cart } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!cart) return null;

  const { data: items } = await supabase
    .from('cart_items')
    .select(
      `
      *,
      product:products(
        *,
        images:product_images(*)
      ),
      poster_size:poster_sizes(*)
    `
    )
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  return {
    ...cart,
    items: (items as CartItem[]) || [],
  };
}

/**
 * Add item to cart.
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
  posterSizeId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get or create cart
  const cart = await getOrCreateCart(userId);
  if (!cart) return { success: false, error: 'Could not create cart' };

  // Check if item already exists
  let existingItemQuery = supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', productId);

  if (posterSizeId) {
    existingItemQuery = existingItemQuery.eq('poster_size_id', posterSizeId);
  } else {
    existingItemQuery = existingItemQuery.is('poster_size_id', null);
  }

  const { data: existingItem } = await existingItemQuery.single();

  if (existingItem) {
    // Update quantity
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);

    if (error) return { success: false, error: error.message };
  } else {
    // Insert new item
    const { error } = await supabase.from('cart_items').insert({
      cart_id: cart.id,
      product_id: productId,
      poster_size_id: posterSizeId || null,
      quantity,
      unit_price: unitPrice,
    });

    if (error) return { success: false, error: error.message };
  }

  // Update cart timestamp
  await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

  // Log activity
  await supabase.from('activity_logs').insert({
    action: 'cart_add',
    entity_type: 'product',
    entity_id: productId,
    details: { product_id: productId, quantity, poster_size_id: posterSizeId },
  });

  return { success: true };
}

/**
 * Update cart item quantity.
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Remove item from cart.
 */
export async function removeFromCart(
  cartItemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Clear all items from cart.
 */
export async function clearCart(cartId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get cart item count.
 */
export async function getCartCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!cart) return 0;

  const { count } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('cart_id', cart.id);

  return count ?? 0;
}
