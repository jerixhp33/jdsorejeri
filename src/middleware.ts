import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Only run middleware on routes that actually need auth:
    // protected user pages, admin pages, and login
    '/dashboard/:path*',
    '/cart/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/admin/:path*',
    '/login',
  ],
};