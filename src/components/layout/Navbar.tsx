'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  CheckCheck,
  Circle,
  Tag,
  Star,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Notification } from '@/types';
import { JDLogo } from '@/components/shared/JDLogo';
import { Tooltip } from '@/components/shared/Tooltip';

import type { Category } from '@/types';

const typeIcon: Record<string, React.ElementType> = {
  order:   Package,
  product: Star,
  offer:   Tag,
  system:  Settings,
  admin:   Info,
};

const typeColor: Record<string, string> = {
  order:   'text-blue-400',
  product: 'text-purple-400',
  offer:   'text-yellow-400',
  system:  'text-white/50',
  admin:   'text-red-400',
};

function NotifItem({
  n,
  onRead,
  onClose,
}: {
  n: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const Icon = typeIcon[n.type] ?? Bell;

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    onClose();
    if (n.action_url) router.push(n.action_url);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-all cursor-pointer',
        n.is_read ? 'opacity-50 hover:opacity-80' : 'hover:bg-white/5'
      )}
    >
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', typeColor[n.type] ?? 'text-white/40')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-xs font-medium truncate', n.is_read ? 'text-white/60' : 'text-white')}>
            {n.title}
          </p>
          {!n.is_read && <Circle className="w-1.5 h-1.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
        </div>
        <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{n.body}</p>
        <p className="text-[10px] text-white/25 mt-1">{formatRelativeTime(n.created_at)}</p>
      </div>
    </div>
  );
}

interface NavbarProps {
  categories?: Category[];
}

export function Navbar({ categories = [] }: NavbarProps) {
  // Get unique product types from active categories, filtering out undefined/null
  const uniqueTypes = Array.from(new Set(categories.map(c => c?.product_type).filter(Boolean)));
  
  const formatTypeLabel = (type: string) => {
    if (!type) return '';
    if (type === 'hair_clip') return 'Hair Clips';
    if (type === 'other') return 'Miscellaneous';
    return type.charAt(0).toUpperCase() + type.slice(1) + 's';
  };

  const typeOrder = ['poster', 'earring', 'hairband', 'bracelet', 'keychain'];
  
  const sortedUniqueTypes = [...uniqueTypes].sort((a, b) => {
    const idxA = typeOrder.indexOf(a as string);
    const idxB = typeOrder.indexOf(b as string);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a as string).localeCompare(b as string);
  });

  const dynamicCategoryLinks = sortedUniqueTypes.map(type => ({
    href: `/category/${type}`,
    label: formatTypeLabel(type as string)
  }));

  const navLinks = [
    { href: '/', label: 'Home' },
    ...dynamicCategoryLinks,
    { href: '/collections', label: 'Collections' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [otherProductsOpen, setOtherProductsOpen] = useState(false);
  const [mobileOtherProductsOpen, setMobileOtherProductsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setNotifOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
    setOtherProductsOpen(false);
  }, [pathname]);

  // Fast database search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const q = searchQuery.trim().toLowerCase();
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        
        if (!res.ok) {
          throw new Error('Search failed');
        }

        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 150);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSuggestions([]);
    }
  }, [searchOpen]);

  // Escape key closes search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) setSearchOpen(false);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  // Lock body scroll and add class when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sidebar-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
    }
    return () => { 
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
    };
  }, [mobileOpen]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  const recentNotifs = notifications.slice(0, 5);

  const MARQUEE_ITEMS = [
    'Wall Posters', 'Artisan Earrings', 'Premium Quality',
    'Museum-Grade Prints', 'Handcrafted', 'Tamil Nadu Delivery',
    'Limited Editions', 'Free Shipping',
  ];
  const [marqueeItems, setMarqueeItems] = useState<string[]>(MARQUEE_ITEMS);

  useEffect(() => {
    async function fetchMarquee() {
      try {
        const { data } = await supabase
          .from('marquee_labels')
          .select('text')
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        
        if (data && data.length > 0) {
          setMarqueeItems(data.map(d => d.text));
        }
      } catch (e) {
        console.error('Failed to fetch marquee texts', e);
      }
    }
    fetchMarquee();
  }, [supabase]);

  const baseItems = marqueeItems.length > 0 ? marqueeItems : MARQUEE_ITEMS;
  const itemsToRender = Array(Math.max(1, Math.ceil(12 / baseItems.length))).fill(baseItems).flat();

  return (
    <>
      <div className={cn(
        "fixed z-50 transition-all duration-500 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[1400px] pointer-events-none flex flex-col items-center",
        scrolled ? "top-2 sm:top-4" : "top-2 sm:top-4"
      )}>
        <header
          className={cn(
            'w-full pointer-events-auto relative z-20 rounded-[2rem] transition-all duration-500',
            scrolled
              ? 'bg-white/[0.08] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/[0.12] hover:border-white/20'
              : 'bg-black/40 backdrop-blur-md border border-white/[0.05] shadow-lg hover:bg-black/60 hover:border-white/10'
          )}
        >
        {/* 1-minute sweeping edge light effect starting from left (270deg) */}
        <div className="nav-edge-light" />
        
        <div className="px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between h-12 sm:h-14 md:h-16">
            {/* Logo */}
            <Link prefetch={true} href="/" className="flex items-center gap-2 group" aria-label="JD Store home">
              <JDLogo size={32} />
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-luxe-accent transition-colors">
                JD Store
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
                <Link prefetch={true} href="/" className={cn("nav-link", pathname === '/' && "active")}>
                  Home
                </Link>
                {dynamicCategoryLinks.map((link) => {
                  const isMain = link.href.includes('poster') || link.href.includes('earring');
                  if (isMain) {
                    return (
                      <Link key={link.href} prefetch={true} href={link.href} className={cn("nav-link", pathname === link.href && "active")}>
                        {link.label}
                      </Link>
                    );
                  }
                  return null;
                })}
                
                {/* Other Products Dropdown */}
                {dynamicCategoryLinks.some(l => !l.href.includes('poster') && !l.href.includes('earring')) && (
                  <div className="relative group" onMouseEnter={() => setOtherProductsOpen(true)} onMouseLeave={() => setOtherProductsOpen(false)}>
                    <button className={cn("nav-link flex items-center gap-1", otherProductsOpen && "text-white")}>
                      Other Products <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {otherProductsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl"
                        >
                          {dynamicCategoryLinks.filter(l => !l.href.includes('poster') && !l.href.includes('earring')).map((link) => (
                            <Link key={link.href} prefetch={true} href={link.href} className={cn("block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors", pathname === link.href && "text-luxe-accent bg-white/5")}>
                              {link.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <Link prefetch={true} href="/collections" className={cn("nav-link", pathname === '/collections' && "active")}>
                  Collections
                </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Tooltip content="Search">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </Tooltip>
              {!loading && user ? (
                <>
                  {/* Notifications — desktop only */}
                  <div className="relative hidden sm:block" ref={notifRef}>
                    <Tooltip content="Notifications">
                      <button
                        onClick={() => {
                          setNotifOpen(!notifOpen);
                          setProfileOpen(false);
                        }}
                        className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                        aria-label="Notifications"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    </Tooltip>

                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-full mt-2 w-80 glass-card overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <Bell className="w-3.5 h-3.5 text-luxe-accent" />
                              <span className="text-sm font-semibold text-white">Notifications</span>
                              {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-luxe-accent text-black text-[10px] font-bold">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-luxe-accent transition-colors"
                              >
                                <CheckCheck className="w-3 h-3" />
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                            {recentNotifs.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <Bell className="w-7 h-7 text-white/10 mb-2" />
                                <p className="text-white/30 text-xs">No notifications yet</p>
                              </div>
                            ) : (
                              recentNotifs.map((n) => (
                                <NotifItem
                                  key={n.id}
                                  n={n}
                                  onRead={markAsRead}
                                  onClose={() => setNotifOpen(false)}
                                />
                              ))
                            )}
                          </div>
                          <div className="border-t border-white/10">
                            <Link prefetch={true} href="/dashboard/notifications"
                              onClick={() => setNotifOpen(false)}
                              className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-luxe-accent hover:bg-white/5 transition-all"
                            >
                              View all notifications
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Wishlist — desktop only */}
                  <Tooltip content="Wishlist">
                    <Link prefetch={true} href="/wishlist"
                      className="hidden sm:flex p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] items-center justify-center"
                      aria-label="Wishlist"
                    >
                      <Heart className="w-5 h-5" />
                    </Link>
                  </Tooltip>

                  {/* Cart */}
                  <Tooltip content="Cart">
                    <Link prefetch={true} href="/cart"
                      className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] hidden md:flex items-center justify-center"
                      aria-label="Cart"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {itemCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                          {itemCount > 9 ? '9+' : itemCount}
                        </span>
                      )}
                    </Link>
                  </Tooltip>

                  {/* Profile — desktop only */}
                  <div className="relative hidden sm:block">
                    <Tooltip content="Profile">
                      <button
                        onClick={() => {
                          setProfileOpen(!profileOpen);
                          setNotifOpen(false);
                        }}
                        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-all min-h-[40px]"
                        aria-label="Profile menu"
                      >
                        {profile?.profile_picture ? (
                          <Image
                            src={profile.profile_picture}
                            alt={profile.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-luxe-accent flex items-center justify-center">
                            <span className="text-black text-xs font-bold">
                              {profile ? getInitials(profile.name) : 'U'}
                            </span>
                          </div>
                        )}
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-white/60 transition-transform',
                            profileOpen && 'rotate-180'
                          )}
                        />
                      </button>
                    </Tooltip>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-full mt-2 w-56 glass-card overflow-hidden"
                        >
                          <Link prefetch={true} href="/dashboard" onClick={() => setProfileOpen(false)} className="block p-3 border-b border-white/10 hover:bg-white/5 transition-all">
                            <p className="text-sm font-medium text-white truncate">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {profile?.email}
                            </p>
                          </Link>
                          <div className="p-1">
                            <Link prefetch={true} href="/dashboard/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <Package className="w-4 h-4" />
                              My Orders
                            </Link>
                            <Link prefetch={true} href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <Settings className="w-4 h-4" />
                              Settings
                            </Link>
                            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                              <Link prefetch={true} href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-luxe-accent hover:bg-white/10 transition-all">
                                <Settings className="w-4 h-4" />
                                Admin Panel
                              </Link>
                            )}
                            <div className="my-1 border-t border-white/10" />
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : !loading ? (
                <Link prefetch={true} href="/login" className="btn-gold !py-2 !px-4 text-sm">
                  Sign In
                </Link>
              ) : null}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Attached Top Label underneath the header pill */}
      <div 
        className={cn(
          "pointer-events-auto w-full transition-all duration-700 ease-in-out transform origin-top flex justify-center",
          scrolled ? "opacity-0 -translate-y-8 pointer-events-none" : "opacity-100 translate-y-0"
        )}
      >
        <div className="w-[90%] bg-luxe-accent text-black rounded-b-2xl sm:rounded-b-3xl overflow-hidden py-1.5 sm:py-2 shadow-[0_10px_30px_rgba(200,169,110,0.2)] relative -mt-3 pt-4 -z-10">
          <div className="flex whitespace-nowrap animate-marquee w-max" style={{ animationDuration: '40s' }}>
            <div className="flex shrink-0">
              {itemsToRender.map((item, i) => (
                <span
                  key={`h1-${i}`}
                  className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 text-black/80 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-bold"
                >
                  <Sparkles className="w-2.5 h-2.5 text-black/40" />
                  {item}
                </span>
              ))}
            </div>
            <div className="flex shrink-0">
              {itemsToRender.map((item, i) => (
                <span
                  key={`h2-${i}`}
                  className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 text-black/80 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-bold"
                >
                  <Sparkles className="w-2.5 h-2.5 text-black/40" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Mobile Navigation — full-screen slide-in drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80vw] max-w-[320px] h-[100dvh] bg-[#0a0a0a]/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-l-[2rem] flex flex-col md:hidden overflow-hidden"
            >
              <div className="side-edge-light" />
              
              <div className="flex-1 flex flex-col overflow-y-auto w-full relative z-10">
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <JDLogo size={28} />
                  <span className="font-display text-lg font-bold text-white tracking-wide">JD Store</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-white/50 bg-white/5 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="p-4 space-y-1.5">
                <Link
                  href="/"
                  prefetch={true}
                  className={cn(
                    'flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all',
                    pathname === '/'
                      ? 'text-luxe-accent bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                
                {dynamicCategoryLinks.map((link) => {
                  const isMain = link.href.includes('poster') || link.href.includes('earring');
                  if (isMain) {
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={true}
                        className={cn(
                          'flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all',
                          pathname === link.href
                            ? 'text-luxe-accent bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return null;
                })}

                {/* Other Products Accordion */}
                {dynamicCategoryLinks.some(l => !l.href.includes('poster') && !l.href.includes('earring')) && (
                  <div className="rounded-2xl border border-transparent overflow-hidden">
                    <button
                      onClick={() => setMobileOtherProductsOpen(!mobileOtherProductsOpen)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Other Products
                      <ChevronDown className={cn("w-4 h-4 transition-transform", mobileOtherProductsOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {mobileOtherProductsOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white/[0.02]"
                        >
                          <div className="p-2 space-y-1">
                            {dynamicCategoryLinks.filter(l => !l.href.includes('poster') && !l.href.includes('earring')).map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                prefetch={true}
                                className={cn(
                                  'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all',
                                  pathname === link.href
                                    ? 'text-luxe-accent bg-white/[0.05]'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                )}
                                onClick={() => setMobileOpen(false)}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <Link
                  href="/collections"
                  prefetch={true}
                  className={cn(
                    'flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all',
                    pathname === '/collections'
                      ? 'text-luxe-accent bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  Collections
                </Link>
                <Link
                  href="/about"
                  prefetch={true}
                  className={cn(
                    'flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all',
                    pathname === '/about'
                      ? 'text-luxe-accent bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  prefetch={true}
                  className={cn(
                    'flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all',
                    pathname === '/contact'
                      ? 'text-luxe-accent bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  Contact
                </Link>
              </nav>

              {/* User section */}
              {user && (
                <div className="p-4 border-t border-white/10 space-y-1">
                  <p className="px-4 py-2 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">My Account</p>

                  {/* Profile info */}
                  {profile && (
                    <Link prefetch={true} href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 mb-2 bg-white/[0.08] backdrop-blur-md rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-all">
                      {profile.profile_picture ? (
                        <Image src={profile.profile_picture} alt={profile.name} width={40} height={40} className="rounded-full ring-2 ring-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-luxe-accent flex items-center justify-center flex-shrink-0 ring-2 ring-white/10 shadow-lg">
                          <span className="text-black text-sm font-bold">{getInitials(profile.name)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate tracking-wide">{profile.name}</p>
                        <p className="text-white/40 text-xs truncate">{profile.email}</p>
                      </div>
                    </Link>
                  )}

                  <div className="space-y-1 mt-2">
                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {!loading && !user && (
                <div className="p-4 border-t border-white/10">
                  <Link prefetch={true} href="/login"
                    className="btn-gold w-full text-center text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-3 sm:px-4"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSearchOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl"
            >
              {/* Glow effect */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-luxe-accent/20 via-transparent to-transparent pointer-events-none" />

              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50">
                {/* Search Input */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); searchInputRef.current?.blur(); }}
                  className="flex items-center gap-3 px-5 py-4 border-b border-white/5"
                >
                  {loadingSuggestions ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-luxe-accent animate-spin flex-shrink-0" />
                  ) : (
                    <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
                  )}
                  <input
                    ref={searchInputRef}
                    type="search"
                    enterKeyHint="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, materials, colors..."
                    className="flex-1 bg-transparent text-white placeholder:text-white/25 outline-none text-base sm:text-lg font-light tracking-wide min-w-0"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                      className="p-1 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-white/5 text-white/25 text-[10px] font-mono border border-white/5 tracking-wider">ESC</kbd>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="sm:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </form>

                {/* Results Area */}
                <div className="max-h-[55vh] overflow-y-auto">
                  {!searchQuery.trim() ? (
                    <div className="p-5">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-3">Quick searches</p>
                      <div className="flex flex-wrap gap-2">
                        {['Posters', 'Earrings', 'Gold', 'Minimal', 'A4', 'Jhumka', 'Abstract', 'Marvel'].map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setSearchQuery(term)}
                            className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs font-medium hover:bg-white/10 hover:text-white hover:border-white/15 transition-all duration-200 cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {loadingSuggestions ? (
                        <div className="py-12 flex flex-col items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-luxe-accent animate-spin" />
                          <p className="text-xs text-white/20 tracking-wide">Searching...</p>
                        </div>
                      ) : suggestions.length > 0 ? (
                        <>
                          <div className="px-5 pt-3 pb-2 flex items-center justify-between">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-semibold">
                              {suggestions.length} {suggestions.length === 1 ? 'result' : 'results'}
                            </p>
                          </div>
                          <div className="px-2 pb-3">
                            {suggestions.map((item) => {
                              const primaryImg = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
                              return (
                                <Link
                                  key={item.slug}
                                  href={`/product/${item.slug}`}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 relative ring-1 ring-white/5">
                                    {primaryImg ? (
                                      <Image src={primaryImg.url} alt={item.name} fill className="object-cover" sizes="48px" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white/15 text-sm">✦</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/80 group-hover:text-white truncate transition-colors">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="inline-flex px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-medium uppercase tracking-wider text-white/30 capitalize">{item.product_type}</span>
                                      {item.price && (
                                        <span className="text-xs font-semibold text-luxe-accent">₹{item.price}</span>
                                      )}
                                      {item.material && (
                                        <span className="text-[10px] text-white/20 capitalize">{item.material}</span>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-luxe-accent transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0" />
                                </Link>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="py-12 flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-white/10" />
                          <p className="text-sm text-white/30">No products found</p>
                          <p className="text-xs text-white/15">Try a different keyword</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
}