import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = await createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles').select('id, role').eq('uid', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null;
  return { profile, adminClient };
}

// Admin analytics API
export async function GET(request: NextRequest) {
  const result = await requireAdmin();
  if (!result) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { adminClient } = result;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'summary') {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalUsers },
      { count: todayUsers },
      { count: totalOrders },
      { count: todayOrders },
      { data: revenueData },
    ] = await Promise.all([
      adminClient.from('user_profiles').select('*', { count: 'exact', head: true }),
      adminClient.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
      adminClient.from('orders').select('*', { count: 'exact', head: true }),
      adminClient.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
      adminClient.from('orders').select('total').not('status', 'eq', 'cancelled'),
    ]);

    const totalRevenue = (revenueData || []).reduce((s: number, o: { total?: number }) => s + (o.total || 0), 0);

    return NextResponse.json({
      data: {
        total_users: totalUsers || 0,
        today_users: todayUsers || 0,
        total_orders: totalOrders || 0,
        today_orders: todayOrders || 0,
        total_revenue: totalRevenue,
      }
    });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

// Admin update order status
export async function PATCH(request: NextRequest) {
  const result = await requireAdmin();
  if (!result) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { profile, adminClient } = result;

  const body = await request.json();
  const { orderId, status, adminNotes } = body;

  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId and status required' }, { status: 400 });
  }

  const validStatuses = ['pending', 'confirmed', 'packed', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: currentOrder } = await adminClient
    .from('orders').select('status, user_id, order_number').eq('id', orderId).single();

  const { error } = await adminClient
    .from('orders')
    .update({ status, admin_notes: adminNotes || null, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await adminClient.from('audit_logs').insert({
    admin_id: profile.id,
    action: 'order_status_update',
    entity_type: 'order',
    entity_id: orderId,
    old_values: { status: currentOrder?.status },
    new_values: { status, admin_notes: adminNotes },
  });

  return NextResponse.json({ success: true });
}