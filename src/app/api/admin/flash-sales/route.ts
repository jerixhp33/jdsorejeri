import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await admin
    .from('flash_sales')
    .select(`
      *,
      products:flash_sale_products(
        id, product_id, product:products(name, images:product_images(url, is_primary))
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, discount_percentage, start_at, end_at, is_active, product_ids } = body;

    // Validate times
    if (new Date(end_at) <= new Date(start_at)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Server-side check for overlapping active sales for the selected products
    if (is_active && product_ids?.length > 0) {
      const { data: overlappingSales, error: overlapErr } = await admin
        .from('flash_sales')
        .select(`id, products:flash_sale_products(product_id)`)
        .eq('is_active', true)
        .lt('start_at', end_at)
        .gt('end_at', start_at);

      if (overlapErr) throw overlapErr;

      // Extract all product IDs currently in an active, overlapping sale
      const overlappingProductIds = overlappingSales?.flatMap(s => s.products.map(p => p.product_id)) || [];
      const conflict = product_ids.find((id: string) => overlappingProductIds.includes(id));

      if (conflict) {
        return NextResponse.json({ 
          error: `Overlap Error: Product ${conflict} is already part of another active flash sale within this timeframe.` 
        }, { status: 400 });
      }
    }

    // Insert the Flash Sale
    const { data: flashSale, error: insertError } = await admin
      .from('flash_sales')
      .insert({ title, description, discount_percentage, start_at, end_at, is_active })
      .select()
      .single();

    if (insertError) throw insertError;

    // Insert products
    if (product_ids?.length > 0) {
      const flashSaleProducts = product_ids.map((pid: string) => ({
        flash_sale_id: flashSale.id,
        product_id: pid
      }));
      
      const { error: productsError } = await admin
        .from('flash_sale_products')
        .insert(flashSaleProducts);

      if (productsError) throw productsError;
    }

    return NextResponse.json(flashSale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
