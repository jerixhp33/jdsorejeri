'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Cart', href: '/cart', icon: ShoppingBag, badge: cartItemsCount },
    { name: 'Profile', href: '/dashboard', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10" />
      
      {/* JD STORE Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="font-display font-black text-[3rem] text-white/[0.03] tracking-widest whitespace-nowrap select-none">
          JD STORE
        </span>
      </div>

      <nav className="relative flex justify-around items-center h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-luxe-accent' : 'text-white/50 hover:text-white/80'
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(200,169,110,0.5)]")} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-luxe-accent text-luxe-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
