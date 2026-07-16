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

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: itemCount },
    { href: user ? '/dashboard' : '/login', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
      <nav className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.includes('/dashboard'));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-luxe-accent' : 'text-white/50 hover:text-white/80'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-6 h-6 transition-transform', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
