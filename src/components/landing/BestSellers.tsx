'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
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
  subtitle = 'Most Loved',
  viewAllLink = '/best-sellers',
  noContainer = false,
}: BestSellersProps) {
  if (!products.length) return null;

  return (
    <section className="py-6 md:py-2">
      <div className={noContainer ? '' : 'page-container'}>
        {/* Header */}
        <SectionHeader title={title} subtitle={subtitle} viewAllLink={viewAllLink} />

        {/* Desktop: Grid — Mobile: Premium horizontal scroll */}
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
function SectionHeader({ title, subtitle, viewAllLink }: { title: string; subtitle: string; viewAllLink: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12">
      <div>
        <motion.p
          initial={false}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
        >
          {subtitle}
        </motion.p>
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

/* ─── Desktop Grid (unchanged behavior) ─── */
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

/* ─── Mobile Carousel ─── */
function MobileCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef(null);
  const isInView = useInView(trackRef, { once: true, margin: '-40px' });
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Tripled items for infinite feel
  const items = [...products.slice(0, 8), ...products.slice(0, 8), ...products.slice(0, 8)];

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  // Start scroll at the second set so user can scroll both directions
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || products.length === 0) return;
    const timer = setTimeout(() => {
      const cardWidth = el.firstElementChild?.getBoundingClientRect().width || 200;
      const gap = 16;
      el.scrollLeft = (cardWidth + gap) * Math.min(products.length, 8);
    }, 100);
    return () => clearTimeout(timer);
  }, [products.length]);

  const scrollNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width || 200;
    el.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
  };

  return (
    <div ref={trackRef} className="relative">
      {/* Scroll container with CSS mask for seamless edge blending */}
      <motion.div
        initial={false}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative -mx-4"
      >
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-6 pt-2 scroll-smooth items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 5%, black 93%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 5%, black 93%, transparent)',
          }}
        >
          {items.map((product, i) => (
            <motion.div
              key={`${product.id}-${i}`}
              initial={false}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: Math.min(i * 0.06, 0.4),
              }}
              className="w-[48vw] flex-shrink-0"
            >
              <ProductCard product={product} index={i % 8} />
            </motion.div>
          ))}
        </div>

        {/* Next arrow indicator */}
        {canScrollRight && (
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-transform"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Scroll progress dots */}
      <ScrollDots
        scrollRef={scrollRef}
        totalSets={3}
        itemsPerSet={Math.min(products.length, 8)}
      />
    </div>
  );
}

/* ─── Scroll Progress Dots ─── */
function ScrollDots({
  scrollRef,
  totalSets,
  itemsPerSet,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  totalSets: number;
  itemsPerSet: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dotCount = Math.min(itemsPerSet, 6);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const cardWidth = el.firstElementChild?.getBoundingClientRect().width || 200;
      const gap = 16;
      const scrollPerCard = cardWidth + gap;
      const rawIndex = Math.round(el.scrollLeft / scrollPerCard);
      setActiveIndex(rawIndex % itemsPerSet);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, itemsPerSet]);

  return (
    <div className="flex justify-center gap-1.5 mt-2">
      {Array.from({ length: dotCount }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-500 ease-out"
          style={{
            width: activeIndex % dotCount === i ? 20 : 6,
            backgroundColor:
              activeIndex % dotCount === i
                ? 'rgba(212, 175, 55, 0.9)'
                : 'rgba(255, 255, 255, 0.15)',
          }}
        />
      ))}
    </div>
  );
}
