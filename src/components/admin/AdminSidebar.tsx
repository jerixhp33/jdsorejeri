'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { JDLogo } from '@/components/shared/JDLogo';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3,
  Image as ImageIcon, Layers, Mail, Settings, FileText, LogOut,
  Star, HelpCircle, Menu, X, Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/collections', label: 'Collections', icon: Layers },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Mail },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const supabase = createClient();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <Link prefetch={true} href="/admin" className="flex items-center gap-2.5" onClick={onClose}>
          <JDLogo size={28} />
          <div>
            <p className="text-white font-bold text-sm">JD Admin</p>
            <p className="text-white/40 text-[10px]">Management Panel</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all md:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-luxe-accent/15 text-luxe-accent border border-luxe-accent/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Link prefetch={true} href="/"
          onClick={onClose}
          className="btn-glass w-full justify-center group mb-2"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Store
        </Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#111] border-b border-white/10 flex items-center px-4 gap-3">
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
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-luxe-near-black border-r border-white/10 flex-col z-40">
        <SidebarContent />
      </div>
    </>
  );
}