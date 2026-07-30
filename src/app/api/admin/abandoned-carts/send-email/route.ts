import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('uid', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { cart } = await req.json();

    if (!cart || !cart.customer_email || !cart.cart_data || cart.cart_data.length === 0) {
      return NextResponse.json({ error: 'Invalid cart data or missing email' }, { status: 400 });
    }

    let itemsHtml = '';
    let total = 0;

    cart.cart_data.forEach((item: any) => {
      const price = item.unit_price * item.quantity;
      total += price;
      
      const imageUrl = item.product?.images?.[0]?.url || 'https://via.placeholder.com/150';
      const productName = item.product?.name || 'Unknown Product';
      
      itemsHtml += `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #eee; width: 100px;">
            <img src="${imageUrl}" alt="${productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: left;">
            <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${productName}</h4>
            <p style="margin: 0; font-size: 14px; color: #666;">Quantity: ${item.quantity}</p>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #333;">
            ${formatCurrency(price)}
          </td>
        </tr>
      `;
    });

    const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luxe-store.vercel.app';
    const checkoutUrl = `${storeUrl}/checkout`;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #111; margin: 0; font-size: 24px;">Did you forget something?</h1>
            <p style="color: #666; font-size: 16px; margin-top: 10px;">
              Hi ${cart.customer_name || 'there'}, we noticed you left some amazing items in your cart. They're waiting for you!
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #666;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #111;">
                  ${formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
          
          <div style="text-align: center;">
            <a href="${checkoutUrl}" style="display: inline-block; background-color: #c8a96e; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Complete Your Order
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>If you have any questions, reply to this email or contact our support team.</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: cart.customer_email,
      subject: "Complete your JD Store purchase 🛍️",
      html: emailHtml
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Send Cart Email API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
