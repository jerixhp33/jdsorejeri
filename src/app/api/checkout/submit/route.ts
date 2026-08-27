import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveFlashSale } from '@/lib/flash-sales';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      items, 
      finalAddressId, 
      deliveryCharge, 
      couponCode, 
      delivery_notes, 
      delivery_instructions, 
      is_gift, 
      gift_message 
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Fetch Flash Sale
    const activeSale = await getActiveFlashSale();

    // 2. Compute true prices server-side
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const targetId = item.product_id || item.product?.id || item.id;

      // Fetch product details
      const { data: product } = await supabase
        .from('products')
        .select('*, product_sizes(*)')
        .eq('id', targetId)
        .maybeSingle();

      let dbPrice = item.unit_price || item.price || 0;
      let finalPrice = dbPrice;

      if (product) {
        dbPrice = product.price || dbPrice || 0;

        // Check if variant based
        if (item.poster_size_id && product.product_type === 'poster') {
          const size = product.product_sizes?.find((s: any) => s.id === item.poster_size_id);
          if (size) dbPrice = size.price;
        }

        // Check flash sale
        if (activeSale && activeSale.products?.some(p => p.product_id === product.id)) {
          finalPrice = Math.round(dbPrice * (1 - activeSale.discount_percentage / 100));
        } else {
          finalPrice = dbPrice;
        }
      }

      calculatedSubtotal += finalPrice * item.quantity;

      validatedItems.push({
        product_id: product?.id || targetId || null,
        poster_size_id: item.poster_size_id || null,
        quantity: item.quantity,
        unit_price: finalPrice,
        total_price: finalPrice * item.quantity
      });
    }

    // 3. Coupon Validation
    let discountAmount = 0;
    let appliedCouponId = null;

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon && new Date(coupon.valid_until).getTime() > Date.now()) {
        if (calculatedSubtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round((calculatedSubtotal * coupon.discount_value) / 100);
            if (coupon.max_discount && discountAmount > coupon.max_discount) {
              discountAmount = coupon.max_discount;
            }
          } else {
            discountAmount = coupon.discount_value;
          }
          appliedCouponId = coupon.id;
        }
      }
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount + deliveryCharge);

    // Fetch user_profiles ID to satisfy orders_user_id_fkey foreign key constraint
    let profileId = user.id;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .or(`uid.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (userProfile?.id) {
      profileId = userProfile.id;
    }

    // Generate Order Number
    const ordNum = `LX${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2,6).toUpperCase()}`;

    // 4. Insert Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: ordNum,
        user_id: profileId,
        status: 'pending',
        delivery_address_id: finalAddressId,
        subtotal: calculatedSubtotal,
        delivery_charge: deliveryCharge,
        discount_amount: discountAmount,
        coupon_id: appliedCouponId,
        total: calculatedTotal,
        delivery_notes: delivery_notes || null,
        delivery_instructions: delivery_instructions || null,
        whatsapp_sent: false,
        is_gift: is_gift || false,
        gift_message: gift_message || null,
      })
      .select().single();

    if (orderErr) throw orderErr;

    // 5. Update Coupon Count
    if (appliedCouponId && couponCode) {
      const { data: coupon } = await supabase.from('coupons').select('used_count').eq('id', appliedCouponId).single();
      if (coupon) {
        await supabase.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', appliedCouponId);
      }
    }

    // 6. Insert Items
    const { error: itemsErr } = await supabase.from('order_items').insert(
      validatedItems.map(item => ({
        order_id: order.id,
        ...item
      }))
    );
    if (itemsErr) throw itemsErr;

    // 7. Prevent duplicate abandoned cart processing for this order
    // Update local setting logic is handled in the cron job by stopping if cart orders exist

    // 8. Send WhatsApp order confirmation and Invoice
    try {
      const { sendWhatsApp, sendWhatsAppImage, generateAndSendInvoice } = await import('@/lib/whatsapp');
      const { data: address } = await supabase
        .from('delivery_addresses')
        .select('phone, full_name')
        .eq('id', finalAddressId)
        .single();

      if (address?.phone) {
        const name = address.full_name?.split(' ')[0] || 'Customer';
        
        // Build product list for the message with clean clickable links & native images
        const productLines = [];
        const productImagesToSend = [];
        for (const item of validatedItems) {
          const { data: prod } = await supabase
            .from('products')
            .select('name, slug, images:product_images(url, is_primary)')
            .eq('id', item.product_id)
            .maybeSingle();

          const prodName = prod?.name || 'Product';
          const prodUrl = prod?.slug ? `https://jdstorejeri.vercel.app/product/${prod.slug}` : '';
          const imgUrl = prod?.images?.find((img: any) => img.is_primary)?.url || prod?.images?.[0]?.url || '';

          let line = `🛍️ *${prodName}* × ${item.quantity} — ₹${item.total_price}`;
          if (prodUrl) line += `\n   🔗 Link: ${prodUrl}`;
          productLines.push(line);

          if (imgUrl) {
            productImagesToSend.push({ url: imgUrl, caption: `${prodName} (Qty: ${item.quantity})` });
          }
        }
        const itemsList = productLines.join('\n\n');

        const orderConfirmationText = 
          `🎉 *Order Placed Successfully!*\n\n` +
          `Hey ${name}! 👋\n\n` +
          `Thank you for your order at *JD Store*! ✨\n\n` +
          `🧾 *Order Number:* #${ordNum}\n\n` +
          `📋 *Your Items:*\n${itemsList}\n\n` +
          (discountAmount > 0 ? `🏷️ *Discount:* -₹${discountAmount}\n` : '') +
          (deliveryCharge > 0 ? `🚚 *Delivery:* ₹${deliveryCharge}\n` : `🚚 *Delivery:* FREE ✨\n`) +
          `💵 *Total:* ₹${calculatedTotal}\n\n` +
          `📦 We'll notify you at every step — from packing to delivery!`;

        if (productImagesToSend.length > 0) {
          // Send single merged card: Product photo on top, Order Confirmation as caption
          await sendWhatsAppImage(address.phone, productImagesToSend[0].url, orderConfirmationText).catch(err => console.error('Failed to send product image', err));
          
          for (let i = 1; i < productImagesToSend.length; i++) {
            await sendWhatsAppImage(address.phone, productImagesToSend[i].url, productImagesToSend[i].caption).catch(err => console.error('Failed to send product image', err));
          }
        } else {
          await sendWhatsApp(address.phone, orderConfirmationText);
        }
        
        // Let the invoice generation happen asynchronously in the background so it doesn't block the checkout response
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jdstorejeri.vercel.app';
        const invoiceUrl = `${siteUrl}/invoice/${order.id}`;
        generateAndSendInvoice(address.phone, invoiceUrl).catch(err => console.error('Failed to async generate invoice', err));
      }
    } catch (waErr) {
      console.error('[whatsapp] Order confirmation failed:', waErr);
      // Non-fatal: don't fail the order if WhatsApp fails
    }

    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
