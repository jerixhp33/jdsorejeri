import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { render } from '@react-email/render';
import { InvoiceEmail } from '@/emails/InvoiceEmail';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Fetch order details
    const { data: order, error } = await admin
      .from('orders')
      .select(`
        *,
        user_profiles:user_id(full_name, email),
        delivery_address:delivery_addresses(*),
        items:order_items(
          *,
          product:products(name, slug, images:product_images(url, is_primary)),
          poster_size:poster_sizes(label)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Customer Email
    const customerEmail = order.user_profiles?.email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
    }

    const customerName = order.delivery_address?.full_name || order.user_profiles?.full_name || 'Customer';
    const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const fullAddress = [
      order.delivery_address?.house_no, 
      order.delivery_address?.street, 
      order.delivery_address?.area, 
      order.delivery_address?.city, 
      order.delivery_address?.district,
      order.delivery_address?.state,
      order.delivery_address?.pincode,
      order.delivery_address?.landmark ? `Near: ${order.delivery_address.landmark}` : ''
    ].filter(Boolean).join(', ');

    // Format items for the email template
    const formattedItems = (order.items || []).map((item: any) => {
      const primaryImg = item.product?.images?.find((img: any) => img.is_primary)?.url || item.product?.images?.[0]?.url;
      return {
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.unit_price,
        image: primaryImg ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${primaryImg}` : undefined,
        size: item.poster_size?.label
      };
    });

    const shippingCost = Number(order.shipping_cost || order.delivery_charge || 0);

    // Render HTML
    const html = await render(
      InvoiceEmail({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: customerName,
        date: order.created_at,
        items: formattedItems,
        subtotal: Number(order.subtotal || 0),
        deliveryCharge: shippingCost,
        discount: Number(order.discount_amount || 0),
        total: Number(order.total || 0),
        shippingAddress: fullAddress,
        storeUrl
      })
    );

    // Setup Nodemailer
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('SMTP not configured, skipping invoice email');
      return NextResponse.json({ success: false, error: 'SMTP not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"JD Store" <${SMTP_USER}>`,
      to: customerEmail,
      subject: `Your Invoice for Order #${order.order_number}`,
      html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Invoice sent successfully' });

  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
