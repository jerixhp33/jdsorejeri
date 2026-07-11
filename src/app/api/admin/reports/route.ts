import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-api';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const period = searchParams.get('period');

  const supabase = await createAdminClient();

  let startDate = new Date();
  if (period === 'today') {
    startDate.setHours(0,0,0,0);
  } else if (period === 'yesterday') {
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0,0,0,0);
  } else if (period === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === 'month') {
    startDate.setDate(1);
    startDate.setHours(0,0,0,0);
  } else {
    // all time
    startDate = new Date(0);
  }

  const startIso = startDate.toISOString();
  let endIso = new Date().toISOString();
  if (period === 'yesterday') {
    const end = new Date(startDate);
    end.setHours(23,59,59,999);
    endIso = end.toISOString();
  }

  try {
    let csvData = '';

    if (type === 'sales') {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at, user_profiles(email)')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false });

      if (data) {
         csvData = 'Order ID,Order Number,Status,Total,Customer Email,Date\n';
         csvData += data.map(d => `${d.id},${d.order_number},${d.status},${d.total},${(d.user_profiles as any)?.email || 'N/A'},${d.created_at}`).join('\n');
      }
    } else if (type === 'customers') {
      const { data } = await supabase
        .from('customers')
        .select('id, customer_number, membership_tier, created_at, user_profiles(name, email)')
        .gte('created_at', startIso)
        .lte('created_at', endIso);

      if (data) {
         csvData = 'Customer ID,Number,Name,Email,Tier,Joined At\n';
         csvData += data.map(d => `${d.id},${d.customer_number},${(d.user_profiles as any)?.name || 'N/A'},${(d.user_profiles as any)?.email || 'N/A'},${d.membership_tier},${d.created_at}`).join('\n');
      }
    } else if (type === 'inventory') {
      const { data } = await supabase
        .from('products')
        .select('id, sku, name, stock, price, is_active');
        // Inventory is real-time, dates matter less here but we could filter by recently added.

      if (data) {
         csvData = 'Product ID,SKU,Name,Stock,Price,Status\n';
         csvData += data.map(d => `${d.id},${d.sku || ''},"${d.name}",${d.stock},${d.price},${d.is_active ? 'Active' : 'Inactive'}`).join('\n');
      }
    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_report_${period}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
