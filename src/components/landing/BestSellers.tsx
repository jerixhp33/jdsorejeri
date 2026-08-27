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

  // 3 sets for looping
  const SETS = 3;
  const allItems = Array.from({ length: SETS }, () => items).flat();

  const getStride = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return 0;
    const card = el.children[0] as HTMLElement;
    return card.offsetWidth + 8; // card width + gap-2
  }, []);

  // Apply curved focus styles directly to DOM — zero React re-renders
  const applyFocus = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centerX = el.scrollLeft + el.clientWidth / 2;
    const cards = el.querySelectorAll<HTMLElement>('[data-card]');
    cards.forEach((card) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(centerX - cardCenter);
      const maxDist = el.clientWidth * 0.55;
      const focus = Math.max(0, Math.min(1, 1 - dist / maxDist));

      const scale = 0.92 + focus * 0.08;
      const blur = (1 - focus) * 1.5;
      const ty = (1 - focus) * 6;
      const op = 0.55 + focus * 0.45;

      card.style.transform = `scale(${scale}) translateY(${ty}px)`;
      card.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';
      card.style.opacity = String(op);
    });
  }, []);

  // Start at set 1 (middle)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const stride = getStride();
        if (!stride) return;
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = stride * itemCount;
        applyFocus();
        requestAnimationFrame(() => { el.style.scrollBehavior = ''; });
      });
    });
  }, [itemCount, getStride, applyFocus]);

  // Track touch state
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onDown = () => { isUserScrolling.current = true; };
    const onUp = () => { setTimeout(() => { isUserScrolling.current = false; }, 600); };
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchend', onUp, { passive: true });
    return () => { el.removeEventListener('touchstart', onDown); el.removeEventListener('touchend', onUp); };
  }, []);

  // Scroll handler — direct DOM, debounced loop reset
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const doReset = () => {
      if (!el || isUserScrolling.current) return;
      const stride = getStride();
      if (!stride) return;

      const currentSnapIndex = Math.round(el.scrollLeft / stride);
      let newSnapIndex = currentSnapIndex;
      let needsReset = false;

      // If we scrolled past the 2nd set, jump back exactly 1 set
      if (currentSnapIndex >= itemCount * 2) {
        newSnapIndex = currentSnapIndex - itemCount;
        needsReset = true;
      } 
      // If we scrolled before the 1st set, jump forward exactly 1 set
      else if (currentSnapIndex < itemCount) {
        newSnapIndex = currentSnapIndex + itemCount;
        needsReset = true;
      }

      if (needsReset) {
        // Jump to the exact mathematical snap point, bypassing smooth scroll
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = newSnapIndex * stride;
        // Force synchronous reflow so browser applies the jump immediately
        void el.offsetHeight;
        el.style.scrollBehavior = '';
        applyFocus();
      }
    };

    const onScroll = () => {
      // Always apply focus on every frame
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          applyFocus();
        });
      }

      // Debounce the loop reset — only fire after scroll fully stops
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(doReset, 600);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [itemCount, getStride, applyFocus]);

  return (
    <div ref={trackRef} className="relative">
      <motion.div
        initial={false}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="relative -mx-4"
      >
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-[25vw] pb-6 pt-2 items-end [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollPaddingInline: '25vw' }}
        >
          {allItems.map((product, i) => {
            const img = product.images?.find((im: any) => im.is_primary)?.url || product.images?.[0]?.url;
            return (
              <div
                key={`bs-${product.id}-${i}`}
                data-card
                className="w-[50vw] flex-shrink-0 snap-center will-change-transform relative"
                style={{ transition: 'transform 0.08s linear, filter 0.12s linear, opacity 0.12s linear' }}
              >
                {/* Neon edge light — perfectly masks out the center to leave a thin 2px glowing rim */}
                {img && (
                  <div
                    className="absolute -inset-[2px] z-20 rounded-[1.125rem] pointer-events-none opacity-80 mix-blend-screen"
                    aria-hidden="true"
                    style={{
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      padding: '2px', // neon border thickness
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'blur(3px) saturate(2)' }}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="relative z-10 h-full">
                  <ProductCard product={product} index={i % itemCount} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

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
