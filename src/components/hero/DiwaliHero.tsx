'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { DiwaliHeroContent } from './DiwaliHeroContent';
import { DiwaliHeroArtwork } from './DiwaliHeroArtwork';

interface DiwaliHeroProps {
  products: Product[];
}

export const diwaliConfig = {
  badge: "🪔 DIWALI SPECIAL",
  title: "Light Up Your Walls This Diwali",
  description: "Celebrate Diwali with posters and accessories that make your space feel unforgettable.",
  primaryCta: "Shop Diwali Collection",
  secondaryCta: "Explore Posters",
  offer: "Festive picks starting from ₹99",
};

export function DiwaliHero({ products }: DiwaliHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <DiwaliHeroSkeleton />;
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#1a0b0c] min-h-[500px] lg:min-h-[600px] flex items-center py-12 lg:py-20">
      {/* Background container for later */}
      <div className="absolute inset-0 z-0 pointer-events-none" />

      <div className="page-container relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left order-2 lg:order-1">
            <DiwaliHeroContent config={diwaliConfig} />
          </div>

          {/* Right: Artwork */}
          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center order-1 lg:order-2">
            <DiwaliHeroArtwork products={products} />
          </div>

        </div>
      </div>
    </section>
  );
}

function DiwaliHeroSkeleton() {
  return (
    <section className="relative w-full bg-[#111] min-h-[500px] lg:min-h-[600px] flex items-center py-12 lg:py-20">
      <div className="page-container relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="flex flex-col items-center lg:items-start space-y-6 w-full order-2 lg:order-1">
            <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
            <div className="h-12 lg:h-20 w-3/4 bg-white/10 rounded-2xl animate-pulse" />
            <div className="h-8 lg:h-12 w-2/3 bg-white/10 rounded-xl animate-pulse" />
            <div className="flex gap-4 w-full justify-center lg:justify-start">
              <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-12 w-36 bg-white/10 rounded-xl animate-pulse" />
            </div>
            <div className="h-4 w-40 bg-white/10 rounded-full animate-pulse mt-4" />
          </div>

          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center order-1 lg:order-2">
            <div className="w-[60%] h-[80%] bg-white/5 rounded-2xl animate-pulse absolute" />
            <div className="w-[50%] h-[70%] bg-white/5 rounded-2xl animate-pulse absolute -translate-x-1/4 -translate-y-8" />
            <div className="w-[50%] h-[70%] bg-white/5 rounded-2xl animate-pulse absolute translate-x-1/4 translate-y-8" />
          </div>

        </div>
      </div>
    </section>
  );
}
