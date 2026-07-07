import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productType = searchParams.get('type');

  try {
    const supabase = await createAdminClient();

    let query = supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (productType) query = query.eq('product_type', productType);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
