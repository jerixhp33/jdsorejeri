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
          const trackLink = body.courier_name?.toLowerCase().includes('st')
            ? `https://stcourier.com/track/status/${body.tracking_number}`
            : body.courier_name?.toLowerCase().includes('sd')
            ? `https://sdcouriers.com/track/${body.tracking_number}`
            : `https://www.google.com/search?q=${encodeURIComponent(`${body.courier_name} tracking ${body.tracking_number}`)}`;

          emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
              <div style="text-align: center; border-bottom: 2px solid #c8a96e; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #c8a96e; margin: 0; font-family: 'Playfair Display', serif; font-size: 24px;">JD Store Dispatch Update</h1>
              </div>
              <p>Hi ${body.customer_name},</p>
              <p>Great news! Your order <strong>#${body.order_number}</strong> status is now <strong>${body.status === 'packed' ? 'Packed' : 'Dispatched'}</strong>.</p>
              
              <div style="background-color: #fcfaf6; padding: 20px; border-radius: 8px; border: 1px solid #f3ebd8; margin: 25px 0;">
                <h3 style="color: #c8a96e; margin-top: 0; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; tracking-wider;">Shipping Details</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Courier Partner:</strong> ${body.courier_name}</p>
                <p style="margin: 0 0 20px 0; font-size: 14px;"><strong>Tracking AWB:</strong> ${body.tracking_number}</p>
                <div style="text-align: center;">
                  <a href="${trackLink}" target="_blank" style="background-color: #c8a96e; color: #000000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">Track Package</a>
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
              <div style="text-align: center; border-bottom: 2px solid #c8a96e; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #c8a96e; margin: 0; font-size: 24px;">JD Store Update</h1>
              </div>
              <p>Hi ${body.customer_name},</p>
              <p>Your order <strong>#${body.order_number}</strong> has been updated.</p>
              <p style="font-size: 15px; line-height: 1.6; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #c8a96e;">${body.message}</p>
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
  const { id, key, ...updates } = body;
  const col = id ? 'id' : 'key';
  const val = id ?? key;
  const { data, error } = await admin.from('orders').update(updates).eq(col, val).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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
