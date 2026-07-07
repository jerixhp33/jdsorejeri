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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Notification } from '@/types';
import { JDLogo } from '@/components/shared/JDLogo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/posters', label: 'Posters' },
  { href: '/earrings', label: 'Earrings' },
  { href: '/collections', label: 'Collections' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

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

export function Navbar() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  }, [pathname]);

  // Search suggestions debouncer
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        let dbQuery = searchQuery.trim().toLowerCase();
        if (dbQuery.endsWith('s') && dbQuery.length > 3) {
          dbQuery = dbQuery.slice(0, -1);
        }

        let words = dbQuery.split(/\s+/).filter(w => w.length > 2);
        let searchType = 'all';
        
        ['poster', 'earring'].forEach(t => {
          if (words.includes(t)) {
            searchType = t;
            words = words.filter(w => w !== t);
          }
        });

        let queryBuilder = supabase
          .from('products')
          .select('slug, name, product_type, price, images:product_images(url, is_primary)')
          .eq('is_active', true)
          .limit(5);

        if (searchType !== 'all') {
          queryBuilder = queryBuilder.eq('product_type', searchType);
        }

        if (words.length > 0) {
          const orConditions = words.map(w => `name.ilike.%${w}%,description.ilike.%${w}%`).join(',');
          queryBuilder = queryBuilder.or(orConditions);
        } else if (searchType === 'all') {
          queryBuilder = queryBuilder.or(`name.ilike.%${dbQuery}%,description.ilike.%${dbQuery}%`);
        }

        const { data } = await queryBuilder;
        
        if (data) {
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const recentNotifs = notifications.slice(0, 5);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'glass-nav' : 'bg-black/30 backdrop-blur-sm'
        )}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Logo */}
            <Link prefetch={true} href="/" className="flex items-center gap-2 group" aria-label="JD Store home">
              <JDLogo size={32} />
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-luxe-accent transition-colors">
                JD Store
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {!loading && user ? (
                <>
                  {/* Notifications — desktop only */}
                  <div className="relative hidden sm:block" ref={notifRef}>
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
                  <Link prefetch={true} href="/wishlist"
                    className="hidden sm:flex p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] items-center justify-center"
                    aria-label="Wishlist"
                  >
                    <Heart className="w-5 h-5" />
                  </Link>

                  {/* Cart */}
                  <Link prefetch={true} href="/cart"
                    className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile — desktop only */}
                  <div className="relative hidden sm:block">
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

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-full mt-2 w-56 glass-card overflow-hidden"
                        >
                          <div className="p-3 border-b border-white/10">
                            <p className="text-sm font-medium text-white truncate">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {profile?.email}
                            </p>
                          </div>
                          <div className="p-1">
                            <Link prefetch={true} href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <User className="w-4 h-4" />
                              My Profile
                            </Link>
                            <Link prefetch={true} href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                              <Package className="w-4 h-4" />
                              My Orders
                            </Link>
                            <Link prefetch={true} href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
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
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-[#0d0d0d] border-l border-white/10 flex flex-col md:hidden overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <JDLogo size={28} />
                  <span className="font-display text-base font-bold text-white">JD Store</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="p-3 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch
                    className={cn(
                      'flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all',
                      pathname === link.href
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* User section */}
              {user && (
                <div className="p-3 border-t border-white/10 space-y-1">
                  <p className="px-4 py-2 text-white/30 text-[11px] uppercase tracking-widest">My Account</p>

                  {/* Profile info */}
                  {profile && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-1">
                      {profile.profile_picture ? (
                        <Image src={profile.profile_picture} alt={profile.name} width={36} height={36} className="rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-luxe-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-black text-xs font-bold">{getInitials(profile.name)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{profile.name}</p>
                        <p className="text-white/40 text-xs truncate">{profile.email}</p>
                      </div>
                    </div>
                  )}

                  {[
                    { href: '/dashboard', label: 'My Profile', icon: User },
                    { href: '/dashboard/orders', label: 'My Orders', icon: Package },
                    { href: '/dashboard/notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
                    { href: '/cart', label: `Cart${itemCount > 0 ? ` (${itemCount})` : ''}`, icon: ShoppingCart },
                    { href: '/wishlist', label: 'Wishlist', icon: Heart },
                    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  ))}

                  {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <Link prefetch={true} href="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-luxe-accent hover:bg-white/5 transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative w-full max-w-2xl"
            >
              <form onSubmit={handleSearch} className="glass-card !rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5 sm:py-4">
                  <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posters, earrings..."
                    className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-base sm:text-lg min-w-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-4 pb-4">
                  {!searchQuery.trim() ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Poster', 'Earring', 'A4', 'Gold'].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            router.push(`/search?q=${encodeURIComponent(term)}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="badge-luxe hover:bg-white/15 transition-all cursor-pointer text-xs py-1.5"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {loadingSuggestions ? (
                        <div className="py-4 flex justify-center">
                           <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-luxe-accent animate-spin" />
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((item) => {
                          const primaryImg = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
                          return (
                            <Link
                              key={item.slug}
                              href={`/product/${item.slug}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0 relative">
                                {primaryImg ? (
                                  <Image src={primaryImg.url} alt={item.name} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">✦</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-white/80 group-hover:text-luxe-accent truncate transition-colors">{item.name}</p>
                                  <p className="text-xs text-white/40 capitalize">{item.product_type}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-luxe-accent transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center text-sm text-white/40">
                          No products found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
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