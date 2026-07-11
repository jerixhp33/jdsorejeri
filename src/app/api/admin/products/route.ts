import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await admin.from('products').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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
    await admin.from('notifications').insert({ user_id: body.user_id, title: `Order #${body.order_number} Update`, body: body.message, type: 'order', action_url: '/dashboard/orders' });
    return NextResponse.json({ success: true });
  }
  const { data, error } = await admin.from('products').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Background task to send New Arrivals emails
  (async () => {
    try {
      // Find all users who opted in to new_arrivals
      const { data: users } = await admin
        .from('user_profiles')
        .select('email, name')
        .contains('notification_preferences', { new_arrivals: true });

      if (users && users.length > 0) {
        const { sendEmail } = await import('@/lib/email');
        // Force the live site URL for emails so it never links to localhost, even when testing locally
        const siteUrl = 'https://jdsorejeri.vercel.app';
        
        await Promise.all(users.map(async (u) => {
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid #333333;">
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="padding: 40px 20px; border-bottom: 1px solid #222222;">
                          <h1 style="color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 2px;">NEW ARRIVAL</h1>
                          <p style="color: #FFFFFF; font-size: 16px; margin: 10px 0 0 0; opacity: 0.8;">JD Store Exclusive</p>
                        </td>
                      </tr>

                      <!-- Content -->
                      <tr>
                        <td align="center" style="padding: 40px 30px;">
                          <p style="color: #FFFFFF; font-size: 18px; margin: 0 0 20px 0; line-height: 1.6;">
                            Hi ${u.name || 'there'},<br>
                            We just added a stunning new piece to our collection:
                          </p>
                          <h2 style="color: #D4AF37; font-size: 24px; margin: 0 0 30px 0;">${data.name}</h2>
                          
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <a href="${siteUrl}/product/${data.slug}" style="display: inline-block; background-color: #D4AF37; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 4px; letter-spacing: 1.5px; text-transform: uppercase;">
                                  Shop Now
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 40px; background-color: #0A0A0A; border-top: 1px solid #222222;">
                          <p style="margin: 0 0 15px 0; font-size: 11px; color: #666666; line-height: 1.5;">
                            You are receiving this email because you opted into New Arrivals notifications at JD Store.<br/>
                            We promise to only send you the good stuff.
                          </p>
                          <p style="margin: 0; font-size: 11px; color: #444444;">
                            &copy; ${new Date().getFullYear()} JD Store. All rights reserved.<br/>
                            Tamil Nadu, India
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;
          
          await sendEmail({
            to: u.email,
            subject: `✨ Just In: ${data.name} is now available!`,
            html,
          });
        }));
      }
    } catch (err) {
      console.error('Failed to send new arrivals broadcast:', err);
    }
  })();

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { id, key, ...updates } = body;
  const col = id ? 'id' : 'key';
  const val = id ?? key;
  const { data, error } = await admin.from('products').update(updates).eq(col, val).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  // Delete all collection_products entries for a given collection
  if (body._type === 'products') {
    const { error } = await admin.from('collection_products').delete().eq('collection_id', body.collection_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  // Delete all collection_products entries for a given product (called before product delete)
  if (body._type === 'collection_products_by_product') {
    const { error } = await admin.from('collection_products').delete().eq('product_id', body.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Handle bulk delete
  if (body._type === 'bulk_delete' && Array.isArray(body.ids)) {
    const { error } = await admin.from('products').delete().in('id', body.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await admin.from('products').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
