import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { getInventoryMetrics } from '@/lib/inventory-analytics';

export async function GET(request: Request) {
  try {
    // Check cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createAdminClient();
    const metrics = await getInventoryMetrics(supabase);

    if (metrics.lowStockItems.length === 0) {
      return NextResponse.json({ success: true, message: 'No low stock items found' });
    }

    // Build the email HTML
    const html = `
      <h2>Low Stock Alert</h2>
      <p>The following items are running low on stock and need to be restocked:</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th align="left">Product Name</th>
            <th align="left">Variant/Size</th>
            <th align="right">Current Stock</th>
            <th align="right">Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.lowStockItems.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.variantName || 'N/A'}</td>
              <td align="right" style="color: red; font-weight: bold;">${item.stock}</td>
              <td align="right">${item.threshold}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br />
      <p><a href="https://jdstorejeri.vercel.app/admin/inventory">View Inventory Dashboard</a></p>
    `;

    // Fetch admin emails (assuming admin role or specific notification preference)
    const { data: admins } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const adminEmails = admins.map(a => a.email);
      
      await sendEmail({
        to: adminEmails.join(','),
        subject: `⚠️ Low Stock Alert: ${metrics.lowStockItems.length} items need attention`,
        html,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent low stock alert for ${metrics.lowStockItems.length} items` 
    });

  } catch (error: any) {
    console.error('Low stock cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
