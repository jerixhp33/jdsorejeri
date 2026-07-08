import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          
          // Force the request headers to update so Server Components see the new cookies
          // This prevents AuthApiError crashes in page.tsx
          request.headers.set('cookie', request.cookies.toString());
          
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Wrap in try/catch — if Supabase is unreachable (network/IPv6 timeout),
  // fall back gracefully instead of crashing the whole request
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.warn('[middleware] Supabase getUser failed:', (err as Error).message);
    // On network failure: allow public pages through, block protected routes
    const path = request.nextUrl.pathname;
    const isProtected =
      path.startsWith('/dashboard') ||
      path.startsWith('/cart') ||
      path.startsWith('/wishlist') ||
      path.startsWith('/checkout') ||
      path.startsWith('/admin');
    if (isProtected) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;
  const isProtectedPath = ['/dashboard', '/cart', '/wishlist', '/checkout'].some(p => path.startsWith(p));
  const isAdminPath = path.startsWith('/admin');
  const isAuthPath = path.startsWith('/login');

  if (!user && (isProtectedPath || isAdminPath)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAdminPath) {
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?uid=eq.${user.id}&select=role&limit=1`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }, cache: 'no-store' }
      );
      const rows = await res.json();
      const profile = rows?.[0];
      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // If admin check fails due to network, redirect to home safely
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/'));
  }

  return supabaseResponse;
}