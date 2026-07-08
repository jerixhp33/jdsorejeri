'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [glowColor, setGlowColor] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const sampleImageColor = useCallback((imgEl: HTMLImageElement) => {
    try {
      const canvas = document.createElement('canvas');
      const SIZE = 40;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(imgEl, 0, 0, SIZE, SIZE);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        const brightness = (pr + pg + pb) / 3;
        if (brightness > 20 && brightness < 235) {
          r += pr; g += pg; b += pb; count++;
        }
      }
      if (count === 0) return;
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      const avg = (r + g + b) / 3;
      const SAT = 1.8;
      r = Math.min(255, Math.round(avg + (r - avg) * SAT));
      g = Math.min(255, Math.round(avg + (g - avg) * SAT));
      b = Math.min(255, Math.round(avg + (b - avg) * SAT));
      setGlowColor(`${r},${g},${b}`);
    } catch {
      // cross-origin image — skip glow
    }
  }, []);

  const images = product.images || [];
  const currentImage = images.length > 0 ? images[imageIndex] : null;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [images.length]);

  const wishlisted = isWishlisted(product.id);

  const activeSizes = product.sizes?.filter((s) => s.is_active !== false) ?? [];
  const sizePrices = activeSizes.map((s) => s.price).filter((p) => p > 0);
  const displayPrice =
    product.product_type === 'poster'
      ? (sizePrices.length > 0 ? Math.min(...sizePrices) : 0)
      : product.price || 0;

  const isInStock =
    product.product_type === 'poster'
      ? activeSizes.some((s) => s.stock > 0)
      : (product.stock ?? 0) > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.product_type === 'poster') {
      router.push(`/product/${product.slug}`);
      return;
    }
    setAddingToCart(true);
    await addItem(product.id, displayPrice);
    setAddingToCart(false);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggle(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      style={{
        position: 'relative',
        borderRadius: '1rem',
        transition: 'box-shadow 0.7s ease',
        ...(glowColor ? {
          boxShadow: `
            0 0 0 1px rgba(${glowColor},0.25),
            0 0 18px 3px rgba(${glowColor},0.10),
            0 6px 28px 0px rgba(${glowColor},0.12),
            0 14px 40px 0px rgba(${glowColor},0.07)
          `,
        } : {
          boxShadow: `0 0 0 1px rgba(200,169,110,0.12), 0 3px 12px rgba(200,169,110,0.04)`,
        }),
      }}
    >
      <Link prefetch={true} href={`/product/${product.slug}`}
        className="block product-card group"
        style={glowColor ? {
          borderColor: `rgba(${glowColor},0.4)`,
          transition: 'border-color 0.7s ease',
          overflow: 'hidden',
        } : { overflow: 'hidden' }}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-[1rem] bg-luxe-gray">
          {images.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={imageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[imageIndex].url}
                  alt={images[imageIndex].alt_text || product.name}
                  fill
                  crossOrigin="anonymous"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={cn(
                    'object-cover transition-all duration-700',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={(e) => {
                    setImageLoaded(true);
                    if (imageIndex === 0) {
                      sampleImageColor(e.currentTarget as unknown as HTMLImageElement);
                    }
                  }}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-luxe-gray">
              <span className="text-white/20 text-4xl">✦</span>
            </div>
          )}

          {/* Slideshow Arrows (visible on hover) */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-20"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Dots indicator - moves up when cart button slides up */}
              <div className="absolute bottom-16 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 transition-all duration-300 sm:group-hover:bottom-16">
                {images.map((_, idx) => (
                  <div key={idx} className={cn("transition-all duration-300 rounded-full", idx === imageIndex ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/40")} />
                ))}
              </div>
            </>
          )}

          {/* Overlay */}
          <div className="image-overlay" />

          {/* Adaptive inner bloom */}
          {glowColor && (
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                background: `radial-gradient(ellipse at 50% 100%, rgba(${glowColor},0.08) 0%, transparent 60%)`,
                transition: 'opacity 0.7s ease',
              }}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[75%]">
            {product.is_best_seller && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-luxe-accent/20 border border-luxe-accent/30 text-luxe-accent text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md">Best Seller</span>
            )}
            {product.is_trending && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md">Trending</span>
            )}
            {!isInStock && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md">Out of Stock</span>
            )}
          </div>

          {/* Wishlist button — always visible on mobile (top right), hover on desktop */}
          <button
            onClick={handleWishlist}
            className={cn(
              'absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-md border transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center',
              'sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0',
              wishlisted
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-black/40 border-white/20 text-white hover:bg-white/20'
            )}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('w-3.5 h-3.5', wishlisted && 'fill-current')} />
          </button>

          {/* Add to cart — bottom slide on desktop, always visible on mobile */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock || addingToCart}
              className={cn(
                'w-full py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 min-h-[36px]',
                isInStock
                  ? 'bg-white text-black hover:bg-luxe-accent'
                  : 'bg-black/60 backdrop-blur-md border border-white/10 text-white/50 cursor-not-allowed'
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {addingToCart
                ? 'Adding...'
                : !isInStock
                  ? 'Out of Stock'
                  : product.product_type === 'poster'
                    ? 'Select Size'
                    : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4">
          <p className="text-white/40 text-[11px] mb-0.5">{product.category?.name}</p>
          <h3 className="text-white text-xs sm:text-sm font-medium leading-snug mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-luxe-accent transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              {product.product_type === 'poster' && displayPrice > 0 && (
                <span className="text-white/40 text-[10px] uppercase tracking-widest">From</span>
              )}
              <span className="text-white font-semibold text-sm sm:text-base">
                {displayPrice > 0 ? formatCurrency(displayPrice) : 'Coming Soon'}
              </span>
            </div>
            {(product.average_rating ?? 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-luxe-accent fill-current" />
                <span className="text-white/50 text-xs">
                  {(product.average_rating ?? 0).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}