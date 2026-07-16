'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user } = useAuth();

  // Don't show bottom nav on desktop, checkout, or admin routes
  if (pathname.includes('/checkout') || pathname.includes('/admin')) {
    return null;
  }

  const getProfileImage = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  };

  const profileImg = getProfileImage();

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <nav className="flex items-center justify-between px-6 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl">
        
        {/* Home */}
        <Link href="/" className={cn("transition-colors", pathname === '/' ? 'text-luxe-accent' : 'text-white/60 hover:text-white')}>
          <Home className="w-6 h-6" strokeWidth={pathname === '/' ? 2.5 : 2} />
        </Link>

        {/* Wishlist */}
        <Link href="/wishlist" className={cn("transition-colors", pathname === '/wishlist' ? 'text-red-500' : 'text-white/60 hover:text-red-400')}>
          <Heart className={cn("w-6 h-6", pathname === '/wishlist' && "fill-current text-red-500")} strokeWidth={pathname === '/wishlist' ? 2.5 : 2} />
        </Link>

        {/* Center Prominent Cart */}
        <Link href="/cart" className="relative -mt-6">
          <div className="w-14 h-14 rounded-full bg-luxe-accent flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] border-4 border-[#0a0a0a] transition-transform active:scale-95">
            <ShoppingCart className="w-6 h-6 text-black" strokeWidth={2.5} />
            {itemCount > 0 && (
              <span className="absolute 0 right-0 top-0 w-5 h-5 bg-white rounded-full text-black text-[11px] font-bold flex items-center justify-center border-2 border-[#0a0a0a]">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
        </Link>

        {/* Profile */}
        <Link href={user ? '/dashboard' : '/login'} className={cn("transition-colors rounded-full overflow-hidden border-2", pathname.includes('/dashboard') ? 'border-luxe-accent text-luxe-accent' : 'border-transparent text-white/60 hover:text-white')}>
          {profileImg ? (
            <img src={profileImg} alt="Profile" className="w-7 h-7 object-cover rounded-full" />
          ) : (
            <User className="w-6 h-6" strokeWidth={pathname.includes('/dashboard') ? 2.5 : 2} />
          )}
        </Link>

      </nav>
    </div>
  );
}
