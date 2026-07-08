import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

// GET all sizes for a product
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  const { data, error } = await admin
    .from('poster_sizes')
    .select('*')
    .eq('product_id', productId)
    .order('price', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — upsert all sizes for a product (replaces existing)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { product_id, sizes } = await req.json();
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

  // Delete existing sizes for this product
  await admin.from('poster_sizes').delete().eq('product_id', product_id);

  if (!sizes || sizes.length === 0) {
    // If no sizes, nullify base price
    await admin.from('products').update({ price: null }).eq('id', product_id);
    return NextResponse.json({ success: true, data: [] });
  }

  const rows = sizes.map((s: any) => ({
    product_id,
    label: s.label,
    width_cm: s.width_cm || null,
    height_cm: s.height_cm || null,
    price: Number(s.price) || 0,
    stock: Number(s.stock) || 0,
    sku: s.sku || `${product_id.slice(0, 8)}-${s.label}`.toUpperCase(),
    is_active: s.is_active ?? true,
  }));

  const { data, error } = await admin.from('poster_sizes').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Sync the lowest size price to the main product for universal filtering/sorting
  const minPrice = Math.min(...rows.map((r: any) => r.price));
  await admin.from('products').update({ price: minPrice }).eq('id', product_id);

  return NextResponse.json({ success: true, data });
}

// DELETE a single size by id, or all sizes for a product by product_id
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (body.product_id) {
    // Delete all sizes for this product (called before product delete)
    const { error } = await admin.from('poster_sizes').delete().eq('product_id', body.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Nullify the base price
    await admin.from('products').update({ price: null }).eq('id', body.product_id);
    return NextResponse.json({ success: true });
  }
  const { error } = await admin.from('poster_sizes').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}