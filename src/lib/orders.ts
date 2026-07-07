import { createClient } from '@/lib/supabase/server';
import { generateOrderNumber, calculateDeliveryCharge } from '@/lib/utils';
import type { Order, CheckoutFormData, CartItem } from '@/types';

/**
 * Create a new order from cart items.
 */
export async function createOrder(
  userId: string,
  userProfileId: string,
  cartItems: CartItem[],
  formData: CheckoutFormData
): Promise<{ order?: Order; error?: string }> {
  const supabase = await createClient();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  const total = subtotal + deliveryCharge;
  const orderNumber = generateOrderNumber();

  // 1. Save delivery address
  const { data: address, error: addressError } = await supabase
    .from('delivery_addresses')
    .insert({
      user_id: userProfileId,
      full_name: formData.full_name,
      phone: formData.phone,
      alternate_phone: formData.alternate_phone || null,
      house_no: formData.house_no,
      street: formData.street,
      area: formData.area,
      city: formData.city,
      district: formData.district,
      pincode: formData.pincode,
      landmark: formData.landmark || null,
    })
    .select()
    .single();

  if (addressError) {
    return { error: 'Failed to save delivery address' };
  }

  // 2. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userProfileId,
      status: 'pending',
      delivery_address_id: address.id,
      subtotal,
      delivery_charge: deliveryCharge,
      total,
      delivery_notes: formData.delivery_notes || null,
      delivery_instructions: formData.delivery_instructions || null,
      whatsapp_sent: false,
    })
    .select()
    .single();

  if (orderError) {
    return { error: 'Failed to create order' };
  }

  // 3. Create order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    poster_size_id: item.poster_size_id || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    return { error: 'Failed to save order items' };
  }

  // 4. Log activity
  await supabase.from('activity_logs').insert({
    user_id: userProfileId,
    action: 'order_created',
    entity_type: 'order',
    entity_id: order.id,
    details: { order_number: orderNumber, total },
  });

  // 5. Create notification for admin
  await supabase.from('notifications').insert({
    title: 'New Order Received',
    body: `Order ${orderNumber} for ₹${total} has been placed by ${formData.full_name}`,
    type: 'order',
    action_url: `/admin/orders/${order.id}`,
  });

  // 6. Create notification for user
  await supabase.from('notifications').insert({
    user_id: userProfileId,
    title: 'Order Placed Successfully!',
    body: `Your order ${orderNumber} has been placed. We'll confirm it via WhatsApp soon.`,
    type: 'order',
    action_url: `/dashboard/orders/${order.id}`,
  });

  return { order: { ...order, delivery_address: address } as Order };
}

/**
 * Get orders for a user.
 */
export async function getUserOrders(
  userProfileId: string,
  page = 1,
  limit = 10
): Promise<{ orders: Order[]; total: number }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('orders')
    .select(
      `
      *,
      delivery_address:delivery_addresses(*),
      items:order_items(
        *,
        product:products(
          *,
          images:product_images(*)
        ),
        poster_size:poster_sizes(*)
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', userProfileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { orders: [], total: 0 };

  return {
    orders: (data as Order[]) || [],
    total: count ?? 0,
  };
}

/**
 * Get a single order by ID.
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      user:user_profiles(*),
      delivery_address:delivery_addresses(*),
      items:order_items(
        *,
        product:products(
          *,
          images:product_images(*)
        ),
        poster_size:poster_sizes(*)
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (error) return null;
  return data as Order;
}

/**
 * Update order status (admin only).
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  adminId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current order for audit
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status, user_id, order_number')
    .eq('id', orderId)
    .single();

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };

  // Create audit log
  await supabase.from('audit_logs').insert({
    admin_id: adminId,
    action: 'order_status_update',
    entity_type: 'order',
    entity_id: orderId,
    old_values: { status: currentOrder?.status },
    new_values: { status, admin_notes: adminNotes },
  });

  // Notify user of status change
  const statusMessages: Record<string, string> = {
    confirmed: 'Your order has been confirmed! 🎉',
    packed: 'Your order has been packed and is ready for dispatch.',
    ready: 'Your order is out for delivery! 🚚',
    delivered: 'Your order has been delivered. Enjoy! 😊',
    cancelled: 'Your order has been cancelled.',
  };

  if (statusMessages[status] && currentOrder?.user_id) {
    await supabase.from('notifications').insert({
      user_id: currentOrder.user_id,
      title: `Order ${currentOrder.order_number} Update`,
      body: statusMessages[status],
      type: 'order',
      action_url: `/dashboard/orders/${orderId}`,
    });
  }

  return { success: true };
}

/**
 * Mark WhatsApp as sent for an order.
 */
export async function markWhatsAppSent(
  orderId: string,
  message: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('orders')
    .update({
      whatsapp_sent: true,
      whatsapp_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}
