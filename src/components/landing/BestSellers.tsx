'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
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
      className="grid grid-cols-3 lg:grid-cols-4 gap-6 items-start"
    >
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </motion.div>
  );
}

/* ─── Mobile Carousel ─── */
function MobileCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef(null);
  const isInView = useInView(trackRef, { once: true, margin: '-40px' });
  const isUserScrolling = useRef(false);
  const itemCount = products.length;
  const items = products;

  // Per-card focus: 0 = side, 1 = center
  const [cardFocus, setCardFocus] = useState<number[]>([]);

  // 3 sets for looping
  const SETS = 3;
  const allItems = Array.from({ length: SETS }, () => items).flat();

  const getStride = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return 0;
    const card = el.children[0] as HTMLElement;
    return card.offsetWidth + 16; // card width + gap
  }, []);

  // Start at set 1 (middle) — NO scroll-behavior so it's instant & invisible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0) return;
    // Use double rAF to ensure layout is done
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const stride = getStride();
        if (!stride) return;
        // Temporarily disable smooth scroll for the silent jump
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = stride * itemCount;
        // Restore after jump
        requestAnimationFrame(() => {
          el.style.scrollBehavior = '';
        });
      });
    });
  }, [itemCount, getStride]);

  // Track user touch to prevent loop-reset during active swipe
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchStart = () => { isUserScrolling.current = true; };
    const onTouchEnd = () => { 
      // Small delay to let momentum finish
      setTimeout(() => { isUserScrolling.current = false; }, 300);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Focus calculation on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!el) return;
        const stride = getStride();
        if (!stride) return;

        const setWidth = stride * itemCount;
        const centerX = el.scrollLeft + el.clientWidth / 2;

        // Silent infinite loop reset — only when user is NOT touching
        if (!isUserScrolling.current) {
          if (el.scrollLeft > setWidth * 2.2) {
            el.style.scrollBehavior = 'auto';
            el.scrollLeft -= setWidth;
            el.style.scrollBehavior = '';
          } else if (el.scrollLeft < setWidth * 0.3) {
            el.style.scrollBehavior = 'auto';
            el.scrollLeft += setWidth;
            el.style.scrollBehavior = '';
          }
        }

        // Calculate per-card focus
        const focuses: number[] = [];
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          const childCenter = child.offsetLeft + child.offsetWidth / 2;
          const dist = Math.abs(centerX - childCenter);
          const maxDist = el.clientWidth * 0.55;
          const focus = Math.max(0, Math.min(1, 1 - dist / maxDist));
          focuses.push(focus);
        }
        setCardFocus(focuses);
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Initial
    requestAnimationFrame(onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [itemCount, getStride]);

  return (
    <div ref={trackRef} className="relative">
      <motion.div
        initial={false}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="relative -mx-4"
      >
        {/* Rainbow aurora edge glows */}
        <div className="absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(168,85,247,0.25), rgba(59,130,246,0.15), rgba(236,72,153,0.1), transparent)',
            filter: 'blur(8px)',
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgba(251,146,60,0.25), rgba(234,179,8,0.15), rgba(168,85,247,0.1), transparent)',
            filter: 'blur(8px)',
          }}
        />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-[15vw] pb-6 pt-2 items-end [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            scrollPaddingInline: '15vw',
          }}
        >
          {allItems.map((product, i) => {
            const focus = cardFocus[i] ?? 0.5;

            // Curved depth: center is full, sides gently recede
            const scale = 0.92 + focus * 0.08;
            const blur = (1 - focus) * 1.5;
            const translateY = (1 - focus) * 6;
            const opacity = 0.55 + focus * 0.45;

            return (
              <div
                key={`bs-${product.id}-${i}`}
                className="w-[55vw] flex-shrink-0 snap-center will-change-transform"
                style={{
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  filter: blur > 0.1 ? `blur(${blur}px)` : 'none',
                  opacity,
                  transition: 'transform 0.1s linear, filter 0.15s linear, opacity 0.15s linear',
                }}
              >
                <ProductCard product={product} index={i % itemCount} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress dots */}
      <ScrollDots scrollRef={scrollRef} itemCount={itemCount} />
    </div>
  );
}

/* ─── Scroll Progress Dots ─── */
function ScrollDots({
  scrollRef,
  itemCount,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  itemCount: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dotCount = Math.min(itemCount, 6);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const card = el.children[0] as HTMLElement | undefined;
      if (!card) return;
      const stride = card.offsetWidth + 16;
      const rawIndex = Math.round(el.scrollLeft / stride);
      setActiveIndex(((rawIndex % itemCount) + itemCount) % itemCount);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, itemCount]);

  return (
    <div className="flex justify-center gap-1.5 mt-3">
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
  );
}
