'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user } = useAuth();
  
  const [isVisible, setIsVisible] = useState(true);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      // Hide on ANY scroll
      setIsVisible(false);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Show again after scrolling stops for 300ms
      const timeout = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      
      setScrollTimeout(timeout);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [scrollTimeout]);

  // Don't show bottom nav on desktop, checkout, or admin routes
  if (pathname.includes('/checkout') || pathname.includes('/admin')) {
    return null;
  }

  const getProfileImage = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  };

  const profileImg = getProfileImage();

  return (
    <div 
      className={cn(
        "md:hidden fixed bottom-6 left-0 right-0 z-[100] flex justify-center transition-all duration-300 ease-in-out pointer-events-none",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      <nav className="flex items-center gap-2 px-2 py-2 w-max bg-white/20 backdrop-blur-xl border border-white/30 rounded-[2rem] shadow-2xl pointer-events-auto">
        
        {/* Home */}
        <Link 
          prefetch={true}
          href="/" 
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95", 
            pathname === '/' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
          )}
        >
          <Home className="w-5 h-5" strokeWidth={pathname === '/' ? 2.5 : 2} />
        </Link>

        {/* Wishlist */}
        <Link 
          prefetch={true}
          href="/wishlist" 
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95", 
            pathname === '/wishlist' ? 'bg-white/20 text-red-500' : 'text-white/70 hover:text-red-400'
          )}
        >
          <Heart className={cn("w-5 h-5", pathname === '/wishlist' && "fill-current text-red-500")} strokeWidth={pathname === '/wishlist' ? 2.5 : 2} />
        </Link>

        {/* Cart */}
        <Link 
          prefetch={true}
          href="/cart" 
          className={cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95", 
            pathname === '/cart' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
          )}
        >
          <ShoppingCart className="w-5 h-5" strokeWidth={pathname === '/cart' ? 2.5 : 2} />
          {itemCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-luxe-accent rounded-full text-black text-[9px] font-bold flex items-center justify-center border-2 border-transparent">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <Link 
          prefetch={true}
          href={user ? '/dashboard' : '/login'} 
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95", 
            pathname.includes('/dashboard') ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
          )}
        >
          {profileImg ? (
            <img src={profileImg} alt="Profile" className="w-6 h-6 object-cover rounded-full border border-white/20" />
          ) : (
            <User className="w-5 h-5" strokeWidth={pathname.includes('/dashboard') ? 2.5 : 2} />
          )}
        </Link>

      </nav>
    </div>
  );
}
