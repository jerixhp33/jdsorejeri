'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCart, Zap } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useHaptic } from '@/hooks/useHaptic';
import type { Product } from '@/types';

interface StickyMobileBuyBarProps {
  product: Product;
  selectedSizePrice?: number;
  selectedSizeName?: string;
  targetId?: string;
}

export function StickyMobileBuyBar({
  product,
  selectedSizePrice,
  selectedSizeName,
  targetId = 'main-buy-button',
}: StickyMobileBuyBarProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  const haptic = useHaptic();

  useEffect(() => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main buy button scrolls UP out of viewport
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.1 }
    );

    observer.observe(targetElement);
    return () => observer.disconnect();
  }, [targetId]);

  if (!visible) return null;

  const displayPrice = selectedSizePrice || product.price || 0;
  const image = product.images?.[0]?.url;

  const handleQuickAdd = async () => {
    if (loading) return;
    setLoading(true);
    haptic('medium');
    try {
      await addItem(product.id, displayPrice, 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:hidden fixed bottom-14 left-0 right-0 z-40 p-3 bg-black/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          {image && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-white/5">
              <Image src={image} alt={product.name} fill className="object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate">{product.name}</h4>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-luxe-accent font-extrabold">{formatCurrency(displayPrice)}</span>
              {selectedSizeName && <span className="text-white/40">• {selectedSizeName}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={loading || product.stock === 0}
          className={cn(
            "px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-lg",
            product.stock === 0
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-luxe-accent text-black hover:bg-yellow-400"
          )}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
