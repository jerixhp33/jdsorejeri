'use client';

import { Sparkles } from 'lucide-react';

const FALLBACK_ITEMS = [
  'Wall Posters', 'Artisan Earrings', 'Premium Quality',
  'Museum-Grade Prints', 'Handcrafted', 'Tamil Nadu Delivery',
  'Limited Editions', 'Free Shipping',
];

export function MarqueeStrip({ labels }: { labels: any[] }) {
  const baseItems = labels && labels.length > 0 ? labels.map(l => l.text) : FALLBACK_ITEMS;
  const itemsToRender = Array(Math.max(1, Math.ceil(12 / baseItems.length))).fill(baseItems).flat();

  return (
    <div className="w-full bg-luxe-accent text-black overflow-hidden py-2 sm:py-2.5">
      <div className="flex whitespace-nowrap animate-marquee w-max" style={{ animationDuration: '40s' }}>
        <div className="flex shrink-0">
          {itemsToRender.map((item, i) => (
            <span
              key={`h1-${i}`}
              className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 text-black/80 text-[11px] sm:text-[12px] tracking-widest uppercase font-bold"
            >
              <Sparkles className="w-3 h-3 text-black/40" />
              {item}
            </span>
          ))}
        </div>
        <div className="flex shrink-0">
          {itemsToRender.map((item, i) => (
            <span
              key={`h2-${i}`}
              className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 text-black/80 text-[11px] sm:text-[12px] tracking-widest uppercase font-bold"
            >
              <Sparkles className="w-3 h-3 text-black/40" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
