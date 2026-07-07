import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;
      const admin = await createAdminClient();

      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const email = user.email || '';
      const profilePicture = user.user_metadata?.avatar_url || null;

      // Check if profile exists — never overwrite role
      const { data: existing } = await admin
        .from('user_profiles').select('id').eq('uid', user.id).single();

      if (existing) {
        await admin.from('user_profiles').update({
          name, email, profile_picture: profilePicture,
          last_active: new Date().toISOString(),
        }).eq('uid', user.id);
      } else {
        await admin.from('user_profiles').insert({
          uid: user.id, name, email,
          profile_picture: profilePicture,
          last_active: new Date().toISOString(),
        });
      }

      const { data: profile } = await admin
        .from('user_profiles').select('id').eq('uid', user.id).single();

      if (profile) {
        const userAgent = request.headers.get('user-agent') || '';
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : null;
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
        let browser = 'Unknown';
        if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = 'Chrome';
        else if (/firefox/i.test(userAgent)) browser = 'Firefox';
        else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
        else if (/edg/i.test(userAgent)) browser = 'Edge';

        await admin.from('login_logs').insert({
          user_id: profile.id,
          login_time: new Date().toISOString(),
          device: isMobile ? 'Mobile' : 'Desktop',
          browser, ip_address: ip, user_agent: userAgent,
        });
      }

      const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/';
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
