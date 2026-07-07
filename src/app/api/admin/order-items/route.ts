import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

// DELETE order_items by product_id or order_id
// Called before deleting a product to clear the FK constraint:
//   order_items_product_id_fkey on table "order_items"
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  if (body.product_id) {
    // Remove all order line items that reference this product
    const { error } = await admin
      .from('order_items')
      .delete()
      .eq('product_id', body.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.order_id) {
    const { error } = await admin
      .from('order_items')
      .delete()
      .eq('order_id', body.order_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'product_id or order_id required' }, { status: 400 });
}
