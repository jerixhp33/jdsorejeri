'use client';

import Image from 'next/image';
import type { Product } from '@/types';

interface DiwaliHeroArtworkProps {
  products: Product[];
}

export function DiwaliHeroArtwork({ products }: DiwaliHeroArtworkProps) {
  // Use up to 3 products for the composition
  const mainProduct = products[0];
  const leftProduct = products[1];
  const rightProduct = products[2];

  if (!mainProduct) return null;

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#f59e0b]/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Left Product */}
      {leftProduct && (
        <div className="absolute z-10 w-[45%] lg:w-[50%] aspect-[3/4] -translate-x-[40%] -translate-y-[10%] -rotate-6 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#111]">
          <Image
            src={leftProduct.images?.[0]?.url || ''}
            alt={leftProduct.name}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 768px) 30vw, 20vw"
          />
        </div>
      )}

      {/* Right Product */}
      {rightProduct && (
        <div className="absolute z-10 w-[45%] lg:w-[50%] aspect-[3/4] translate-x-[40%] translate-y-[10%] rotate-6 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#111]">
          <Image
            src={rightProduct.images?.[0]?.url || ''}
            alt={rightProduct.name}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 768px) 30vw, 20vw"
          />
        </div>
      )}

      {/* Main Product */}
      <div className="absolute z-20 w-[55%] lg:w-[60%] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 bg-[#111]">
        <Image
          src={mainProduct.images?.[0]?.url || ''}
          alt={mainProduct.name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 30vw"
        />
      </div>

    </div>
  );
}
