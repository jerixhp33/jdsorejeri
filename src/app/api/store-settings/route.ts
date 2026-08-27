import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const admin = await createAdminClient();
    const { data: settings, error } = await admin
      .from('settings')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settingsMap: Record<string, any> = {
      // Default fallbacks
      custom_poster_price_a5: 199,
      custom_poster_price_a4: 299,
      custom_poster_price_a3: 449,
      custom_poster_frame_black_price: 150,
      custom_poster_frame_white_price: 150,
      custom_poster_frame_wood_price: 200,
      custom_poster_paper_gsm: '300 GSM Gallery Paper',
      custom_poster_paper_finish: 'Ultra-Matte Archival Finish',
      custom_poster_dispatch_time: 'Dispatched in 24h'
    };

    if (settings && Array.isArray(settings)) {
      settings.forEach((s) => {
        let val = s.value;
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        settingsMap[s.key] = val;
      });
    }

    return NextResponse.json(settingsMap);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
