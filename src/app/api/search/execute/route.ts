import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { SearchIntent } from '@/types/search';

export async function POST(req: Request) {
  try {
    const { query: rawQuery } = await req.json();
    if (!rawQuery || typeof rawQuery !== 'string') {
      return NextResponse.json([]);
    }

    const queryStr = rawQuery.toLowerCase().trim();
    const supabase = await createAdminClient();
    
    // Determine category based on simple word matching
    let productType = 'all';
    let queryWords = queryStr.split(/\s+/).filter(w => w.length > 2);
    
    ['poster', 'posters', 'art'].forEach(t => {
      if (queryWords.includes(t)) {
        productType = 'poster';
        queryWords = queryWords.filter(w => w !== t);
      }
    });
    
    ['earring', 'earrings', 'jewelry'].forEach(t => {
      if (queryWords.includes(t)) {
        productType = 'earring';
        queryWords = queryWords.filter(w => w !== t);
      }
    });

    let selectStr = `*, category:product_categories(id, name, slug), images:product_images(url, is_primary, display_order), sizes:poster_sizes(id, label, price, stock, width_cm, height_cm)`;
    
    let dbQuery = supabase
      .from('products')
      .select(selectStr)
      .eq('is_active', true);

    if (productType !== 'all') {
      dbQuery = dbQuery.eq('product_type', productType);
    }

    if (queryWords.length > 0) {
      // Build an OR condition that checks name, description, and tags for each word
      const keywordConditions = queryWords.map(w => 
        `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`
      ).join(',');
      dbQuery = dbQuery.or(keywordConditions);
    }

    const { data, error } = await dbQuery.limit(50);
    
    if (error) throw error;
    if (!data) return NextResponse.json([]);

    const ranked = (data as any[]).map(product => {
      let score = 0;
      const nameLower = product.name?.toLowerCase() || '';
      const descLower = product.description?.toLowerCase() || '';
      const tags = product.tags || [];

      queryWords.forEach(kw => {
        const k = kw.toLowerCase();
        if (nameLower === k) score += 100;
        else if (nameLower.includes(k)) score += 50;
        if (tags.includes(k)) score += 30;
        if (descLower.includes(k)) score += 10;
      });

      if (productType !== 'all' && product.product_type === productType) score += 20;
      score += (product.review_count || 0) * 0.1;
      score += (product.average_rating || 0) * 2;

      return {
        product,
        relevanceScore: score,
        matchType: score >= 100 ? 'exact' : score >= 50 ? 'prefix' : 'fuzzy'
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json(ranked);
  } catch (error: any) {
    console.error('Search execute error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
