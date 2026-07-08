import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { parseSearchIntent } from '@/lib/groq';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const productType = searchParams.get('type');
  const categoryId = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'newest';
  const inStock = searchParams.get('inStock') === '1';
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null;
  const offset = (page - 1) * limit;

  try {
    // Use admin client to bypass RLS — products with is_active=true are public anyway
    const supabase = await createAdminClient();

    let query = supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name, slug),
        images:product_images(url, is_primary, display_order),
        sizes:poster_sizes(id, label, price, stock, width_cm, height_cm)
      `, { count: 'exact' })
      .eq('is_active', true);

    let effectiveProductType = productType;
    
    // Use AI parser if search is provided
    if (search) {
      const intent = await parseSearchIntent(search);
      
      // Override productType if AI detected one
      if (intent.productType && intent.productType !== 'all') {
        effectiveProductType = intent.productType;
      }
      
      // Add keyword search
      if (intent.keywords && intent.keywords.length > 0) {
        const orConditions = intent.keywords.map(w => `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`).join(',');
        query = query.or(orConditions);
      } else {
        // Fallback
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Override max price if AI detected one
      if (intent.maxPrice !== null) {
        query = query.lte('price', intent.maxPrice);
      }
      if (intent.minPrice !== null) {
        query = query.gte('price', intent.minPrice);
      }
    }

    if (effectiveProductType) query = query.eq('product_type', effectiveProductType);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (inStock) query = query.gt('stock', 0);
    // Apply URL maxPrice only if AI didn't already override it
    if (maxPrice !== null && (!search || !(await parseSearchIntent(search)).maxPrice)) query = query.lte('price', maxPrice);

    switch (sort) {
      case 'price_asc': query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'popular': query = query.order('review_count', { ascending: false }); break;
      case 'rating': query = query.order('average_rating', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: offset + limit < (count || 0),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
