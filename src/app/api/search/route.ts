import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const supabase = await createAdminClient();
    
    let maxPrice: number | null = null;
    let minPrice: number | null = null;
    let cleanQ = q;

    // Detect "under X", "below X", "< X"
    const maxMatch = q.match(/(?:under|below|less than|<)\s*(?:rs|inr|₹|r)?\s*(\d+)/i);
    if (maxMatch) {
      maxPrice = parseInt(maxMatch[1], 10);
      cleanQ = cleanQ.replace(maxMatch[0], '').trim();
    }

    // Detect "above X", "over X", "> X"
    const minMatch = cleanQ.match(/(?:above|over|more than|>)\s*(?:rs|inr|₹|r)?\s*(\d+)/i);
    if (minMatch) {
      minPrice = parseInt(minMatch[1], 10);
      cleanQ = cleanQ.replace(minMatch[0], '').trim();
    }

    // Strip trailing 's' from words to handle basic plurals (e.g. posters -> poster)
    const words = cleanQ.split(/\s+/)
      .map((w: string) => w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w)
      .filter((w: string) => w.length >= 2);

    // Fetch product IDs that match the searched size (e.g. "A4")
    let sizeProductIds: string[] = [];
    if (words.length > 0) {
      const sizeMatch = await supabase.from('poster_sizes').select('product_id').ilike('label', `%${cleanQ}%`);
      sizeProductIds = sizeMatch.data?.map((s: any) => s.product_id) || [];
    }

    let query = supabase
      .from('products')
      .select('id, slug, name, product_type, price, material, color, tags, images:product_images(url, is_primary), sizes:poster_sizes(label)')
      .eq('is_active', true)
      .limit(maxPrice !== null || minPrice !== null ? 24 : 15);

    if (maxPrice !== null) query = query.lte('price', maxPrice);
    if (minPrice !== null) query = query.gte('price', minPrice);

    if (words.length > 0) {
      const validTypes = ['poster', 'earring', 'hairband', 'bracelet', 'keychain', 'apparel', 'accessory'];
      const orConditions = words.map((w: string) => {
        let condition = `name.ilike.%${w}%,description.ilike.%${w}%,material.ilike.%${w}%,color.ilike.%${w}%,tags.cs.{${w}}`;
        // Exact match for enums if the search word happens to be a valid enum value
        if (validTypes.includes(w)) {
          condition += `,product_type.eq.${w}`;
        }
        return condition;
      });
      
      let finalOrString = orConditions.join(',');
      
      if (sizeProductIds.length > 0) {
        finalOrString += `,id.in.(${sizeProductIds.join(',')})`;
      }

      query = query.or(finalOrString);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Score and sort by relevance
    const scored = (data || []).map((item: any) => {
      let score = 0;
      const nameLower = (item.name || '').toLowerCase();
      const typeLower = (item.product_type || '').toLowerCase();
      words.forEach((w: string) => {
        if (nameLower.includes(w)) score += 10;
        if (typeLower.includes(w)) score += 5;
        if (item.tags?.some((t: string) => t.toLowerCase().includes(w))) score += 5;
        if ((item.material || '').toLowerCase().includes(w)) score += 3;
        if ((item.color || '').toLowerCase().includes(w)) score += 3;
        if (item.sizes?.some((s: any) => s.label.toLowerCase().includes(w))) score += 5;
      });
      return { ...item, _score: score };
    });
    scored.sort((a: any, b: any) => b._score - a._score);

    return NextResponse.json(scored);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
