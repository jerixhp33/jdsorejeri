import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { SearchIntent } from '@/types/search';

export async function POST(req: Request) {
  try {
    const intent: SearchIntent = await req.json();
    const supabase = await createAdminClient();
    
    let selectStr = `*, category:product_categories(id, name, slug), images:product_images(url, is_primary, display_order)`;
    
    if (intent.sizes.length > 0 && intent.productType !== 'earring') {
      selectStr += `, sizes!inner(id, label, price, stock, width_cm, height_cm)`;
    } else {
      selectStr += `, sizes:poster_sizes(id, label, price, stock, width_cm, height_cm)`;
    }

    let query = supabase
      .from('products')
      .select(selectStr)
      .eq('is_active', true);

    if (intent.productType !== 'all') {
      query = query.eq('product_type', intent.productType);
    } else if (intent.sizes.length > 0) {
      query = query.eq('product_type', 'poster');
    }

    if (intent.sizes.length > 0 && intent.productType !== 'earring') {
      query = query.ilike('sizes.label', `%${intent.sizes[0]}%`);
    }

    if (intent.keywords.length > 0) {
      const keywordConditions = intent.keywords.map(w => 
        `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`
      ).join(',');
      query = query.or(keywordConditions);
    }

    if (intent.maxPrice !== null) query = query.lte('price', intent.maxPrice);
    if (intent.minPrice !== null) query = query.gte('price', intent.minPrice);
    if (intent.category) query = query.ilike('category.name', `%${intent.category}%`);

    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    if (!data) return NextResponse.json([]);

    const ranked = (data as any[]).map(product => {
      let score = 0;
      const nameLower = product.name?.toLowerCase() || '';
      const descLower = product.description?.toLowerCase() || '';
      const tags = product.tags || [];

      intent.keywords.forEach(kw => {
        const k = kw.toLowerCase();
        if (nameLower === k) score += 100;
        else if (nameLower.includes(k)) score += 50;
        if (tags.includes(k)) score += 30;
        if (descLower.includes(k)) score += 10;
      });

      if (intent.productType !== 'all' && product.product_type === intent.productType) score += 20;
      score += (product.review_count || 0) * 0.1;
      score += (product.average_rating || 0) * 2;

      return {
        product,
        relevanceScore: score,
        matchType: score >= 100 ? 'exact' : score >= 50 ? 'prefix' : 'fuzzy'
      };
    }).sort((a, b) => {
      if (intent.sort === 'price_asc') return (a.product.price || 0) - (b.product.price || 0);
      if (intent.sort === 'price_desc') return (b.product.price || 0) - (a.product.price || 0);
      if (intent.sort === 'newest') return new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime();
      return b.relevanceScore - a.relevanceScore;
    });

    return NextResponse.json(ranked);
  } catch (error: any) {
    console.error('Search execute error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
