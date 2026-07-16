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
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        "md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-32"
      )}
    >
      <nav className="flex items-center justify-between px-2 py-2 w-[85%] max-w-[320px] bg-background/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
        
        {/* Home */}
        <Link 
          href="/" 
          className={cn(
            "flex items-center justify-center h-12 px-5 rounded-full transition-all duration-300", 
            pathname === '/' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
          )}
        >
          <Home className="w-5 h-5" strokeWidth={pathname === '/' ? 2.5 : 2} />
        </Link>

        {/* Wishlist */}
        <Link 
          href="/wishlist" 
          className={cn(
            "flex items-center justify-center h-12 px-5 rounded-full transition-all duration-300", 
            pathname === '/wishlist' ? 'bg-white/10 text-red-500' : 'text-white/50 hover:text-red-400'
          )}
        >
          <Heart className={cn("w-5 h-5", pathname === '/wishlist' && "fill-current text-red-500")} strokeWidth={pathname === '/wishlist' ? 2.5 : 2} />
        </Link>

        {/* Cart */}
        <Link 
          href="/cart" 
          className={cn(
            "relative flex items-center justify-center h-12 px-5 rounded-full transition-all duration-300", 
            pathname === '/cart' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
          )}
        >
          <ShoppingCart className="w-5 h-5" strokeWidth={pathname === '/cart' ? 2.5 : 2} />
          {itemCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-luxe-accent rounded-full text-black text-[9px] font-bold flex items-center justify-center border-2 border-background">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <Link 
          href={user ? '/dashboard' : '/login'} 
          className={cn(
            "flex items-center justify-center h-12 px-5 rounded-full transition-all duration-300", 
            pathname.includes('/dashboard') ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
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
