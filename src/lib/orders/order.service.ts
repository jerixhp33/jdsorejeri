import { createClient } from '@/lib/supabase/server';
import { generateOrderNumber } from '@/lib/utils';
import { calculateOrderPricing } from './pricing.service';
import type { CartItem, CheckoutFormData, Order, OrderStatus } from '@/types';

/**
 * Core service for Orders domain.
 * Handles database interactions and business logic for orders.
 */
export class OrderService {
  /**
   * Creates a new order along with delivery address and order items.
   * Also triggers the initial order_event via database trigger.
   */
  static async createOrder(
    userId: string,
    userProfileId: string,
    cartItems: CartItem[],
    formData: CheckoutFormData
  ): Promise<{ order?: Order; error?: string }> {
    const supabase = await createClient();

    // 1. Calculate precise pricing
    const pricing = calculateOrderPricing(cartItems, 0, 0, 0); // Expand with real shipping/tax rules if needed
    const orderNumber = generateOrderNumber();

    // 2. Save delivery address
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
      console.error('Order creation: Address error', addressError);
      return { error: 'Failed to save delivery address' };
    }

    // 3. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userProfileId,
        order_number: orderNumber,
        status: 'pending', // Starts as pending until payment confirmed
        delivery_address_id: address.id,
        // Legacy fields for backward compatibility
        total: pricing.grandTotal,
        delivery_charge: pricing.shipping,
        // New explicit fields
        grand_total: pricing.grandTotal,
        shipping_cost: pricing.shipping,
        tax: pricing.tax,
        discount_amount: pricing.discount,
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation: Order error', orderError);
      return { error: 'Failed to create order' };
    }

    // 4. Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      selected_size: (item as any).selected_size,
      selected_color: (item as any).selected_color,
      selected_material: (item as any).selected_material,
      poster_size_id: item.poster_size_id || null,
      poster_size: (item as any).poster_size,
      poster_frame: (item as any).poster_frame,
      poster_finish: (item as any).poster_finish,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order creation: Items error', itemsError);
      // We should ideally rollback here, but Supabase JS doesn't have explicit transactions yet.
      // In a real production system, this entire function should be an RPC call.
      return { error: 'Failed to save order items' };
    }

    return { order };
  }

  /**
   * Updates an order's status and logs the event.
   */
  static async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    adminId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      console.error('Status update error', updateError);
      return { success: false, error: 'Failed to update order status' };
    }

    // 2. Log event
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        event_type: 'status_change',
        title: `Status updated to ${newStatus}`,
        description: notes || null,
        actor_type: 'admin',
        performed_by: adminId,
        metadata: { status: newStatus }
      });

    if (eventError) {
      console.error('Failed to log event', eventError);
      // Non-fatal error
    }

    return { success: true };
  }
}
