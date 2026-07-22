import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { product_id, cross_sells } = await req.json();
    
    if (!product_id || !Array.isArray(cross_sells)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Delete existing cross_sells for this product
    const { error: deleteError } = await admin
      .from('product_cross_sells')
      .delete()
      .eq('product_id', product_id);

    if (deleteError) throw deleteError;

    // 2. Insert new cross_sells
    if (cross_sells.length > 0) {
      // Safely extract string IDs and deduplicate to avoid unique constraint violations
      const validIds = cross_sells
        .map(csId => typeof csId === 'string' ? csId : (csId?.cross_sell_product_id || csId?.id))
        .filter(Boolean);
      
      const uniqueIds = Array.from(new Set(validIds));

      const inserts = uniqueIds.map((csId, index) => ({
        product_id,
        cross_sell_product_id: csId,
        display_order: index,
      }));

      const { error: insertError } = await admin
        .from('product_cross_sells')
        .insert(inserts);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error syncing cross sells:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
