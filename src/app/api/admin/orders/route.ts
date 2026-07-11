import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await admin.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

import { sendWebPushToUser } from '@/lib/web-push-helper';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  // Handle collection_products insert
  if (body._type === 'collection_products') {
    const { error } = await admin.from('collection_products').insert(body.items);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  // Handle order notification
  if (body._notify) {
    await admin.from('notifications').insert({ 
      user_id: body.user_id, 
      title: `Order #${body.order_number} Update`, 
      body: body.message, 
      type: 'order', 
      action_url: '/dashboard/orders' 
    });
    
    // Also send web push notification
    await sendWebPushToUser(body.user_id, {
      title: `Order #${body.order_number} Update`,
      body: body.message,
      url: '/dashboard/orders'
    });

    // Send email notification to customer if requested
    if (body._send_email && body.email) {
      try {
        const { sendEmail } = await import('@/lib/email');
        let emailHtml = '';

        if (body.status === 'packed' || body.status === 'ready') {
          const trackLink = 'https://stcourier.com/track/shipment';

          emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
              <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #000000; margin: 0; font-family: 'Playfair Display', serif; font-size: 24px;">JD Store Dispatch Update</h1>
              </div>
              <p>Hi ${body.customer_name},</p>
              <p>Great news! Your order <strong>#${body.order_number}</strong> status is now <strong>${body.status === 'packed' ? 'Packed' : 'Dispatched'}</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5; margin: 25px 0;">
                <h3 style="color: #000000; margin-top: 0; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; tracking-wider;">Shipping Details</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Courier Partner:</strong> ${body.courier_name}</p>
                <p style="margin: 0 0 15px 0; font-size: 14px;"><strong>Tracking AWB:</strong> <code style="font-family: monospace; background-color: #eaeaea; padding: 3px 6px; border-radius: 4px; font-size: 15px; font-weight: bold; color: #111;">${body.tracking_number}</code></p>
                <p style="margin: 0 0 15px 0; font-size: 12px; color: #666666;">Copy the AWB number above and paste it on the tracking page linked below.</p>
                <div style="text-align: center;">
                  <a href="${trackLink}" target="_blank" style="background-color: #000000; color: #000000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">Track Package</a>
                </div>
              </div>

              <p>If you have any questions or require support, please contact us via WhatsApp.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center; border-top: 1px solid #eeeeee; padding-top: 15px;">
                Thank you for shopping with JD Store!<br>
                <em>Art for every space</em>
              </p>
            </div>
          `;
        } else {
          emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
              <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #000000; margin: 0; font-size: 24px;">JD Store Update</h1>
              </div>
              <p>Hi ${body.customer_name},</p>
              <p>Your order <strong>#${body.order_number}</strong> has been updated.</p>
              <p style="font-size: 15px; line-height: 1.6; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #000000;">${body.message}</p>
              <p style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center; border-top: 1px solid #eeeeee; padding-top: 15px;">
                Thank you for shopping with JD Store!
              </p>
            </div>
          `;
        }

        await sendEmail({
          to: body.email,
          subject: `JD Store - Order #${body.order_number} Update`,
          html: emailHtml
        });
      } catch (err) {
        console.error('[email-notify] Failed to send dispatch email:', err);
      }
    }
    
    return NextResponse.json({ success: true });
  }
  const { data, error } = await admin.from('orders').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await req.json();
  const { id, key, tracking_data, ...updates } = body;
  const col = id ? 'id' : 'key';
  const val = id ?? key;
  
  const { data, error } = await admin.from('orders').update(updates).eq(col, val).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Log the event if a major status was updated
  if (data?.id && (updates.status || updates.payment_status || updates.fulfillment_status)) {
    const eventTitles: string[] = [];
    if (updates.status) eventTitles.push(`Order status updated to ${updates.status}`);
    if (updates.payment_status) eventTitles.push(`Payment marked as ${updates.payment_status}`);
    if (updates.fulfillment_status) eventTitles.push(`Fulfillment marked as ${updates.fulfillment_status}`);
    
    await admin.from('order_events').insert({
      order_id: data.id,
      event_type: 'status_update',
      title: eventTitles.join(', '),
      actor_type: 'admin',
    });
  }

  // General Notification for status changes
  if (data?.id && data?.user_id && (updates.status || updates.payment_status === 'paid')) {
    try {
      const { data: addressData } = await admin.from('delivery_addresses').select('full_name').eq('id', data.delivery_address_id).single();
      const { data: profile } = await admin.from('user_profiles').select('email, name').eq('id', data.user_id).single();
      
      const customerName = addressData?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'Customer';
      const customerEmail = profile?.email;
      
      let msg = '';
      if (updates.payment_status === 'paid') {
        msg = `Great news! The payment for your order #${data.order_number} has been received successfully.`;
      } else if (updates.status) {
        const statusText = updates.status.replace(/_/g, ' ');
        msg = `Your order #${data.order_number} status is now ${statusText}.`;
      }

      // In-App Notification
      await admin.from('notifications').insert({ 
        user_id: data.user_id, 
        title: `Order #${data.order_number} Update`, 
        body: msg, 
        type: 'order', 
        action_url: '/dashboard/orders' 
      });

      // Web Push Notification
      const { sendWebPushToUser } = await import('@/lib/web-push-helper');
      await sendWebPushToUser(data.user_id, {
        title: `Order #${data.order_number} Update`,
        body: msg,
        url: '/dashboard/orders',
        icon: '/icon-192x192.png'
      }).catch(() => {});

      // General Email Notification (only if not sending a dispatch email later)
      if (customerEmail && !tracking_data?.notify_email) {
        const { sendEmail } = await import('@/lib/email');
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 15px; margin-bottom: 20px;">
              <h1 style="color: #000000; margin: 0; font-family: 'Playfair Display', serif; font-size: 24px;">JD Store Update</h1>
            </div>
            <p>Hi ${customerName},</p>
            <p>${msg}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders" style="background-color: #000000; color: #ffffff; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">View Your Order</a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #888888; text-align: center; border-top: 1px solid #eeeeee; padding-top: 15px;">
              Thank you for shopping with JD Store!<br>
              <em>Art for every space</em>
            </p>
          </div>
        `;
        await sendEmail({
          to: customerEmail,
          subject: `JD Store - Order #${data.order_number} Update`,
          html: emailHtml
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to send general notification', err);
    }
  }

  // Handle Shipment Creation and Notifications
  if (tracking_data && data?.id) {
    // 1. Create Shipment Record
    await admin.from('shipments').insert({
      order_id: data.id,
      provider: tracking_data.provider,
      tracking_number: tracking_data.tracking_number,
      tracking_url: tracking_data.tracking_url || null,
      status: updates.status === 'out_for_delivery' ? 'out_for_delivery' : 'shipped',
      shipped_at: new Date().toISOString()
    });

    // 2. Add In-App Notification (Web Toast)
    if (data.user_id) {
      const msg = `Your order #${data.order_number} has been ${updates.status === 'out_for_delivery' ? 'out for delivery' : 'shipped'} via ${tracking_data.provider}. AWB: ${tracking_data.tracking_number}`;
      await admin.from('notifications').insert({ 
        user_id: data.user_id, 
        title: `Order #${data.order_number} Dispatched`, 
        body: msg, 
        type: 'order', 
        action_url: '/dashboard/orders' 
      });

      // 3. Web Push (if subscribed)
      try {
        const { sendWebPushToUser } = await import('@/lib/web-push-helper');
        await sendWebPushToUser(data.user_id, {
          title: `Order #${data.order_number} Dispatched`,
          body: msg,
          url: '/dashboard/orders',
          icon: '/icon-192x192.png'
        });
      } catch (e) {
        console.error('Failed to send web push', e);
      }
    }

    // 4. Trigger Email if requested
    if (tracking_data.notify_email) {
      try {
        // Fetch customer info if we don't have email in orders table
        // Wait, orders table doesn't have email, it's either in user_profiles or we join it?
        // Actually, sometimes guest orders have email. If it's a guest order? 
        // We can fetch from delivery_address or user_profiles
        const { data: addressData } = await admin.from('delivery_addresses').select('full_name, user_id').eq('id', data.delivery_address_id).single();
        let customerEmail = '';
        let customerName = addressData?.full_name?.split(' ')[0] || 'Customer';

        if (addressData?.user_id) {
          const { data: profile } = await admin.from('user_profiles').select('email, name').eq('id', addressData.user_id).single();
          customerEmail = profile?.email || '';
          if (!addressData?.full_name) customerName = profile?.name || 'Customer';
        } else if (data.user_id) {
          const { data: profile } = await admin.from('user_profiles').select('email, name').eq('id', data.user_id).single();
          customerEmail = profile?.email || '';
        }

        if (customerEmail) {
          // Re-use the existing POST logic internally by calling the POST handler or just duplicating the email payload
          // It's cleaner to just call the internal sendEmail
          const { sendEmail } = await import('@/lib/email');
          const trackLink = tracking_data.tracking_url || `https://www.google.com/search?q=${tracking_data.provider}+tracking+${tracking_data.tracking_number}`;
          
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h1 style="color: #000000; text-align: center;">JD Store Dispatch Update</h1>
              <p>Hi ${customerName},</p>
              <p>Your order <strong>#${data.order_number}</strong> is now <strong>${updates.status === 'out_for_delivery' ? 'Out for Delivery' : 'Shipped'}</strong>.</p>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p><strong>Courier:</strong> ${tracking_data.provider}</p>
                <p><strong>AWB:</strong> ${tracking_data.tracking_number}</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${trackLink}" target="_blank" style="background-color: #000000; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 6px;">Track Package</a>
                </div>
              </div>
            </div>
          `;
          await sendEmail({
            to: customerEmail,
            subject: `Order #${data.order_number} Dispatched - JD Store`,
            html: emailHtml
          });
        }
      } catch (emailErr) {
        console.error('Email failed to send', emailErr);
      }
    }
  }
  
  // fetch the complete order to return
  const { data: fullOrder } = await admin.from('orders')
    .select('*, items:order_items(*), delivery_address:delivery_addresses(*), shipments(*), payments(*), events:order_events(*)')
    .eq('id', data.id)
    .single();

  return NextResponse.json({ order: fullOrder || data });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (body._type === 'products') {
    const { error } = await admin.from('collection_products').delete().eq('collection_id', body.collection_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  const { error } = await admin.from('orders').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
