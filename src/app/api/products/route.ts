import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null;
  const offset = (page - 1) * limit;

  try {
    const supabase = await createAdminClient();

    const selectStr = `id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, average_rating, category:product_categories(id, name), images:product_images(id, url, alt_text, is_primary, display_order), sizes:poster_sizes(id, label, price, stock, is_active)`;

    let query = supabase
      .from('products')
      .select(selectStr, { count: 'planned' })
      .eq('is_active', true);

    // Text search — split into words, match against name/description/tags
    if (search) {
      const words = search.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 0) {
        const validTypes = ['poster', 'earring', 'hairband', 'bracelet', 'keychain', 'apparel', 'accessory'];
        const orConditions = words.map(w => {
          let condition = `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`;
          if (validTypes.includes(w)) {
            condition += `,product_type.eq.${w}`;
          }
          return condition;
        }).join(',');
        query = query.or(orConditions);
      }
    }

    if (productType) query = query.eq('product_type', productType);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (inStock) query = query.gt('stock', 0);
    if (maxPrice !== null) query = query.lte('price', maxPrice);
    if (minPrice !== null) query = query.gte('price', minPrice);

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

    const response = NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: offset + limit < (count || 0),
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
