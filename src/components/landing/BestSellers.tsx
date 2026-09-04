  'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import dynamic from 'next/dynamic';
const QuickBuyOverlay = dynamic(() => import('@/components/landing/QuickBuyOverlay').then(mod => mod.QuickBuyOverlay), { ssr: false });
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  noContainer?: boolean;
}

export function BestSellers({
  products,
  title = 'Best Sellers',
  subtitle,
  viewAllLink = '/best-sellers',
  noContainer = false,
}: BestSellersProps) {
  if (!products.length) return null;

  return (
    <section className="py-1 md:py-2">
      <div className={noContainer ? '' : 'page-container'}>
        {/* Header */}
        <SectionHeader title={title} subtitle={subtitle} viewAllLink={viewAllLink} />

        {/* Desktop: Grid — Mobile: Premium carousel */}
        <div className="hidden md:block">
          <DesktopGrid products={products} />
        </div>
        <div className="md:hidden">
          <MobileCarousel products={products} />
        </div>
      </div>
    </section>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle, viewAllLink }: { title: string; subtitle?: string; viewAllLink: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5 md:mb-10">
      <div>
        {subtitle && (
          <motion.p
            initial={false}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-luxe-accent text-sm tracking-widest uppercase mb-2"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.h2
          initial={false}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.08 }}
          className="section-title"
        >
          {title}
        </motion.h2>
      </div>
      <motion.div
        initial={false}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
      >
        <Link
          prefetch={true}
          href={viewAllLink}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
        >
          View all products
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
}

/* ─── Desktop Grid ─── */
function DesktopGrid({ products }: { products: Product[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8 items-start"
    >
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </motion.div>
  );
}


/* ─── Mobile Carousel (Auto-scrolling with center spotlight) ─── */
function MobileCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef(null);
  const isInView = useInView(trackRef, { once: true, margin: '-40px' });
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemCount = products.length;

  // Auto-scroll state refs (no re-renders)
  const autoScrollRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollVelocityRef = useRef(0.5); // pixels per frame
  const lastActiveRef = useRef(-1);

  // Get the stride (card width + gap)
  const getStride = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return 0;
    const card = el.children[0] as HTMLElement;
    return card.offsetWidth + 8; // gap-2 = 8px
  }, []);

  // Apply center spotlight — GPU-only properties (transform, opacity, zIndex)
  const applySpotlight = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centerX = el.scrollLeft + el.clientWidth / 2;
    const cards = el.children;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(centerX - cardCenter);
      const maxDist = el.clientWidth * 0.6;

      // 0 = far away, 1 = dead center
      const focus = Math.max(0, Math.min(1, 1 - dist / maxDist));

      // Center card: scale 1.08, lift up -14px, full opacity, z-50
      // Side cards: scale 0.88, push down +6px, dim to 0.5 opacity, z-0
      const scale = 0.88 + focus * 0.2;
      const ty = (1 - focus) * 6 - focus * 14;
      const op = 0.5 + focus * 0.5;

      card.style.transform = `scale(${scale}) translateY(${ty}px)`;
      card.style.opacity = String(op);
      card.style.zIndex = focus > 0.5 ? '50' : '0';
    }
  }, []);

  // Smoothly auto-scroll using rAF — no jank, no layout thrash
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0) return;

    const stride = getStride();
    if (!stride) return;

    // Start in the middle set
    el.style.scrollBehavior = 'auto';
    el.scrollLeft = stride * itemCount;
    applySpotlight();

    const tick = () => {
      if (!isPausedRef.current && el) {
        el.scrollLeft += scrollVelocityRef.current;

        // Loop reset: if we've scrolled past set 2, jump back to set 1
        const maxScroll = stride * itemCount * 2;
        if (el.scrollLeft >= maxScroll) {
          el.scrollLeft -= stride * itemCount;
        }
      }

      // Always apply spotlight (even when paused, user might be swiping)
      applySpotlight();

      // Update active dot (only on change to avoid re-renders)
      const rawIndex = Math.round(el.scrollLeft / stride);
      const normalizedIndex = ((rawIndex % itemCount) + itemCount) % itemCount;
      if (lastActiveRef.current !== normalizedIndex) {
        lastActiveRef.current = normalizedIndex;
        setActiveIndex(normalizedIndex);
      }

      autoScrollRef.current = requestAnimationFrame(tick);
    };

    autoScrollRef.current = requestAnimationFrame(tick);

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [itemCount, getStride, applySpotlight]);

  // Pause auto-scroll on user interaction, resume after delay
  const pauseAutoScroll = useCallback(() => {
    isPausedRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 3000); // Resume after 3s of inactivity
  }, []);

  // Touch handlers
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = () => pauseAutoScroll();
    const onTouchEnd = () => {
      // Update active index after user swipe settles
      setTimeout(() => {
        const stride = getStride();
        if (!stride) return;
        const rawIndex = Math.round(el.scrollLeft / stride);
        const normalizedIndex = ((rawIndex % itemCount) + itemCount) % itemCount;
        setActiveIndex(normalizedIndex);
      }, 150);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [pauseAutoScroll, getStride, itemCount]);

  // 3 sets for seamless looping
  const allItems = [...products, ...products, ...products];

  const dotCount = Math.min(itemCount, 6);

  return (
    <div ref={trackRef} className="relative">
      <motion.div
        initial={false}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 -mx-4"
      >
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-[25vw] pb-10 pt-6 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            scrollPaddingInline: '25vw',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'none',
          }}
        >
          {allItems.map((product, i) => {
            const img = product.images?.find((im: any) => im.is_primary)?.url || product.images?.[0]?.url;
            return (
              <div
                key={`bs-${product.id}-${i}`}
                className="w-[40vw] flex-shrink-0 relative cursor-pointer will-change-transform"
                style={{
                  transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pauseAutoScroll();
                  setQuickBuyProduct(product);
                }}
              >
                <div className="rounded-2xl overflow-hidden bg-luxe-card border border-white/10 shadow-lg">
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] w-full bg-[#111]">
                    {img ? (
                      <Image
                        src={img}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 40vw, 30vw"
                        priority={i < 4}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </div>

                  {/* Product Name Only */}
                  <div className="px-3 py-2.5">
                    <p className="text-white text-xs font-medium leading-snug line-clamp-1">
                      {product.name}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-1 relative z-10">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full"
            style={{
              width: activeIndex % dotCount === i ? 18 : 5,
              backgroundColor:
                activeIndex % dotCount === i
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(255, 255, 255, 0.15)',
              transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Quick Buy Overlay */}
      <QuickBuyOverlay product={quickBuyProduct} onClose={() => setQuickBuyProduct(null)} />
    </div>
  );
}
