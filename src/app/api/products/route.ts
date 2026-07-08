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

    let effectiveProductType = productType;
    let sizeFilter = '';
    let query: any;
    
    // Use AI parser if search is provided
    if (search) {
      const intent = await parseSearchIntent(search);
      
      // Override productType ONLY if we are in global search (productType was not explicitly provided in the URL)
      if (!productType && intent.productType && intent.productType !== 'all') {
        effectiveProductType = intent.productType;
      }
      
      // If AI detected a size, enforce sizes!inner, but ONLY if we aren't strictly in the earrings section
      if (intent.sizes && intent.sizes.length > 0 && productType !== 'earring') {
        effectiveProductType = 'poster';
        sizeFilter = intent.sizes[0];
      }

      let selectStr = `*, category:product_categories(id, name, slug), images:product_images(url, is_primary, display_order)`;
      if (sizeFilter) {
        selectStr += `, sizes!inner(id, label, price, stock, width_cm, height_cm)`;
      } else {
        selectStr += `, sizes:poster_sizes(id, label, price, stock, width_cm, height_cm)`;
      }

      let queryBuilder = supabase.from('products').select(selectStr, { count: 'exact' }).eq('is_active', true);
      
      if (sizeFilter) {
        queryBuilder = queryBuilder.ilike('sizes.label', `%${sizeFilter}%`);
      }
      
      // Add keyword search
      if (intent.keywords && intent.keywords.length > 0) {
        const orConditions = intent.keywords.map((w: string) => `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`).join(',');
        queryBuilder = queryBuilder.or(orConditions);
      } else {
        // Fallback
        queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Override max price if AI detected one
      if (intent.maxPrice !== null) {
        queryBuilder = queryBuilder.lte('price', intent.maxPrice);
      }
      if (intent.minPrice !== null) {
        queryBuilder = queryBuilder.gte('price', intent.minPrice);
      }
      
      query = queryBuilder;
    } else {
      query = supabase
        .from('products')
        .select(`*, category:product_categories(id, name, slug), images:product_images(url, is_primary, display_order), sizes:poster_sizes(id, label, price, stock, width_cm, height_cm)`, { count: 'exact' })
        .eq('is_active', true);
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
