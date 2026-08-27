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
      {products.slice(0, 8).map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </motion.div>
  );
}

/* ─── Mobile Carousel with Curved Depth + Infinite Loop ─── */
function MobileCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef(null);
  const isInView = useInView(trackRef, { once: true, margin: '-40px' });
  const itemCount = Math.min(products.length, 8);
  const items = products.slice(0, itemCount);

  // Per-card visibility state: 0 = fully blurred/scaled, 1 = center/focused
  const [cardFocus, setCardFocus] = useState<number[]>([]);

  // Seamless infinite loop: when user scrolls to 3rd set, silently jump back to 2nd
  // We render 5 sets for smooth looping
  const SETS = 5;
  const allItems = Array.from({ length: SETS }, () => items).flat();

  const getCardMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return null;
    const card = el.children[0] as HTMLElement;
    const cardWidth = card.offsetWidth;
    const gap = 16;
    return { cardWidth, gap, stride: cardWidth + gap };
  }, []);

  // Start at set 2 (middle) for bidirectional scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0) return;
    const t = requestAnimationFrame(() => {
      const metrics = getCardMetrics();
      if (!metrics) return;
      el.scrollLeft = metrics.stride * itemCount * 2;
    });
    return () => cancelAnimationFrame(t);
  }, [itemCount, getCardMetrics]);

  // Infinite loop reset + curved focus calculation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const metrics = getCardMetrics();
        if (!metrics) return;

        const { stride } = metrics;
        const setWidth = stride * itemCount;
        const centerX = el.scrollLeft + el.clientWidth / 2;

        // Silent jump for seamless loop
        if (el.scrollLeft >= setWidth * 4) {
          el.scrollLeft -= setWidth * 2;
        } else if (el.scrollLeft <= setWidth * 0.5) {
          el.scrollLeft += setWidth * 2;
        }

        // Calculate per-card focus (0..1) based on distance from center
        const focuses: number[] = [];
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          const childCenter = child.offsetLeft + child.offsetWidth / 2;
          const dist = Math.abs(centerX - childCenter);
          const maxDist = el.clientWidth * 0.6;
          const focus = Math.max(0, 1 - dist / maxDist);
          focuses.push(focus);
        }
        setCardFocus(focuses);
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Initial calc
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [itemCount, getCardMetrics]);

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
          className="flex gap-4 overflow-x-auto px-4 pb-4 pt-1 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          }}
        >
          {allItems.map((product, i) => {
            const focus = cardFocus[i] ?? 0;
            // Curved depth: center card is scale 1, sharp, lifted
            // Side cards shrink, blur, and drop
            const scale = 0.88 + focus * 0.12; // 0.88 → 1.0
            const blur = (1 - focus) * 2.5; // 2.5px → 0
            const translateY = (1 - focus) * 8; // 8px down → 0
            const opacity = 0.5 + focus * 0.5; // 0.5 → 1.0

            return (
              <div
                key={`${product.id}-${i}`}
                className="w-[46vw] flex-shrink-0 will-change-transform"
                style={{
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
                  opacity,
                  transition: 'transform 0.15s ease-out, filter 0.2s ease-out, opacity 0.2s ease-out',
                }}
              >
                <ProductCard product={product} index={i % itemCount} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress indicator */}
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
      setActiveIndex(rawIndex % itemCount);
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
            width: activeIndex % dotCount === i ? 20 : 6,
            backgroundColor:
              activeIndex % dotCount === i
                ? 'rgba(212, 175, 55, 0.9)'
                : 'rgba(255, 255, 255, 0.15)',
            transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.4s ease',
          }}
        />
      ))}
    </div>
  );
}
