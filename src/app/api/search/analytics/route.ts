import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { action, query, resultsCount, aiProcessingMs, productId } = await req.json();

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const supabase = await createAdminClient();

    if (action === 'log') {
      await supabase.from('search_logs').insert({
        query,
        results_count: resultsCount || 0,
        ai_processing_ms: aiProcessingMs || 0,
      });

      if (resultsCount === 0) {
        await supabase.from('zero_result_searches').insert({ query });
      }

      // Update popular searches
      const { data: existing } = await supabase
        .from('popular_searches')
        .select('id, score')
        .eq('query', query)
        .single();
        
      if (existing) {
        await supabase.from('popular_searches').update({ score: existing.score + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('popular_searches').insert({ query, score: 1 });
      }
    } 
    else if (action === 'click') {
      await supabase.from('search_clicks').insert({
        query,
        product_id: productId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    // Silent fail for analytics so we don't break frontend
    return NextResponse.json({ success: false });
  }
}
