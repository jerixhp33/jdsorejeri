import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// AI crawler bots to actively block with 403
const AI_BOT_PATTERNS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'CCBot',
  'anthropic-ai', 'ClaudeBot', 'Google-Extended', 'PerplexityBot',
  'Bytespider', 'Applebot-Extended', 'Meta-ExternalAgent', 'FacebookBot',
  'cohere-ai', 'Diffbot', 'ImagesiftBot', 'Omgilibot',
];

export async function middleware(request: NextRequest) {
  // Layer 4: Block AI bots with 403 Forbidden
  const ua = request.headers.get('user-agent') || '';
  if (AI_BOT_PATTERNS.some((bot) => ua.toLowerCase().includes(bot.toLowerCase()))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Only run session logic on auth-required routes
  const authRoutes = ['/dashboard', '/cart', '/wishlist', '/checkout', '/admin', '/login'];
  if (authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (images, icons, manifest)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$|manifest\\.webmanifest).*)',
  ],
};