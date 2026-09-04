'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product } from '@/types';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DiwaliHeroMobileProps {
  products: Product[];
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🛍️' },
  { id: 'diwali', label: 'Diwali', icon: '🪔' },
  { id: 'posters', label: 'Posters', icon: '🖼️' },
  { id: 'accessories', label: 'Accessories', icon: '🎧' },
  { id: 'gifts', label: 'Gifts', icon: '🎁' },
];

export function DiwaliHeroMobileBlinkit({ products }: DiwaliHeroMobileProps) {
  const [activeCategory, setActiveCategory] = useState('diwali');
  const { addItem, items } = useCart();

  const handleAdd = (product: Product) => {
    // Assuming product has variants, we might just add the first one, or prompt.
    // For this quick UI, we just add the base product.
    const price = product.product_type === 'poster' ? (product.sizes?.[0]?.price || 0) : (product.price || 0);
    addItem(
      product.id,
      price,
      1,
      product.sizes?.[0]?.id
    );
  };

  return (
    <div className="md:hidden w-full bg-gradient-to-b from-[#a5f3fc] via-[#86efac]/30 to-[#bae6fd] min-h-[500px] pb-8 pt-4 relative overflow-hidden">
      
      {/* Decorative Clouds Background (SVG) */}
      <div className="absolute top-10 inset-x-0 flex justify-between pointer-events-none opacity-40 z-0">
        <svg width="150" height="80" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1332 20.176 10.218 17.8596 10.021C17.4332 7.18228 14.9702 5 12 5C9.44499 5 7.24151 6.64333 6.33596 8.90382C3.89674 9.06526 2 11.0854 2 13.5C2 16.5376 4.46243 19 7.5 19H17.5Z" />
        </svg>
        <svg width="200" height="100" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="-scale-x-100 mt-8">
          <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1332 20.176 10.218 17.8596 10.021C17.4332 7.18228 14.9702 5 12 5C9.44499 5 7.24151 6.64333 6.33596 8.90382C3.89674 9.06526 2 11.0854 2 13.5C2 16.5376 4.46243 19 7.5 19H17.5Z" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Categories Horizontal Scroll */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 py-6 border-b border-white/20">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex flex-col items-center min-w-[72px] shrink-0 gap-2 relative"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 shadow-sm",
                activeCategory === cat.id ? "bg-white shadow-md scale-110" : "bg-white/50"
              )}>
                {cat.icon}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-colors text-center w-full truncate",
                activeCategory === cat.id ? "text-gray-900" : "text-gray-600"
              )}>
                {cat.label}
              </span>
              {activeCategory === cat.id && (
                <motion.div layoutId="activeCat" className="absolute -bottom-6 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
          ))}
        </div>

        {/* Product Cards Horizontal Scroll */}
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 pt-6 pb-2">
          {products.map((product) => {
            const price = product.product_type === 'poster' ? (product.sizes?.[0]?.price || 0) : (product.price || 0);
            const originalPrice = price * 1.5; // Dummy original price for UI
            const cartItem = items.find(i => i.id === product.id);
            const inCart = !!cartItem;

            return (
              <div key={product.id} className="w-[140px] shrink-0 flex flex-col bg-transparent">
                {/* Image Card */}
                <div className="relative w-full aspect-[4/5] bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-2">
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={product.images?.[0]?.url || ''}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                  </div>
                  
                  {/* Unit & Add Button Overlay */}
                  <div className="absolute -bottom-3 left-1 right-1 flex justify-between items-center bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden h-8">
                    <span className="text-[10px] text-gray-500 font-medium pl-2 truncate">1 pc</span>
                    <button
                      onClick={() => handleAdd(product)}
                      className="h-full px-2.5 bg-white text-green-600 hover:bg-green-50 border-l border-gray-200 flex items-center justify-center font-bold"
                    >
                      {inCart ? <span className="text-xs">{cartItem.quantity}</span> : <Plus className="w-4 h-4" strokeWidth={3} />}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="px-1 mt-4">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                    <span className="font-bold text-gray-900 bg-[#fde047] px-1 rounded">{formatCurrency(price)}</span>
                    <span className="text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                  </div>
                  <h3 className="text-xs text-gray-800 font-medium leading-snug line-clamp-2 min-h-[32px] mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[9px] text-gray-500">
                    <span>⚡ 25 mins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* See All */}
        <div className="px-4 mt-6 flex justify-center">
          <Link href="/products" className="bg-white px-6 py-2 rounded-full text-xs font-bold text-[#1e1b4b] shadow-sm border border-white/50 flex items-center gap-2">
            See all products <span className="text-lg leading-none">›</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
