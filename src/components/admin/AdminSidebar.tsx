'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { JDLogo } from '@/components/shared/JDLogo';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3,
  Image as ImageIcon, Layers, Mail, Settings, FileText, LogOut,
  Star, HelpCircle, Menu, X, Ticket, ChevronLeft, Type, Bell, Tag, Truck, ShoppingCart, Sparkles, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/logs', label: 'Logs', icon: FileText },
    ],
  },
  {
    title: 'STOREFRONT & THEME',
    items: [
      { href: '/admin/theme', label: 'Theme & Atmosphere', icon: Sparkles },
      { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
      { href: '/admin/flash-sales', label: 'Flash Sales', icon: Tag },
      { href: '/admin/banner-generator', label: 'Banner Studio', icon: ImageIcon },
      { href: '/admin/marquee', label: 'Marquee Text', icon: Type },
    ],
  },
  {
    title: 'COMMERCE & ORDERS',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: ShoppingCart },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck },
      { href: '/admin/waitlist', label: 'Waitlists', icon: Bell },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    ],
  },
  {
    title: 'CATALOG & CONTENT',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/collections', label: 'Collections', icon: Layers },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/testimonials', label: 'Testimonials', icon: Star },
      { href: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
      { href: '/admin/broadcast', label: 'Broadcast', icon: Mail },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const supabase = createClient();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#111]">
      {/* Header / Logo */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#161616]">
        <Link prefetch={true} href="/admin" className="flex items-center gap-2.5" onClick={onClose}>
          <JDLogo size={28} />
          <div>
            <p className="text-white font-bold text-sm leading-none">JD Admin</p>
            <p className="text-white/40 text-[10px] mt-1">Management Panel</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all md:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List with Group Headers */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-luxe-accent/80 tracking-widest uppercase mb-1">
              {group.title}
            </p>
            {group.items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    isActive
                      ? 'bg-luxe-accent/15 text-luxe-accent border border-luxe-accent/30 font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Pinned at Bottom */}
      <div className="p-3 border-t border-white/10 shrink-0 bg-[#141414] space-y-1.5">
        <Link
          prefetch={true}
          href="/"
          onClick={onClose}
          className="btn-glass w-full justify-center group text-xs py-2"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Store
        </Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#111] border-b border-white/10 flex items-center px-4 gap-3 print:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <JDLogo size={24} />
          <span className="text-white font-bold text-sm">JD Admin</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'md:hidden fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-[#111] z-50 flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-luxe-near-black border-r border-white/10 flex-col z-40 print:hidden">
        <SidebarContent />
      </div>
    </>
  );
}