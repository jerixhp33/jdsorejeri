'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useHaptic } from '@/hooks/useHaptic';
import { formatCurrency, cn } from '@/lib/utils';
import { Tooltip } from '@/components/shared/Tooltip';
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
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.05,
    triggerOnce: true,
  });

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
    if (images.length <= 1 || !isHovered) return;
    const timer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const wishlisted = isWishlisted(product.id);

  const activeSizes = product.sizes?.filter((s) => s.is_active !== false) ?? [];
  const sizePrices = activeSizes.map((s) => s.price).filter((p) => p > 0);
  const hasVariants = activeSizes.length > 0;

  const displayPrice = hasVariants
    ? (sizePrices.length > 0 ? Math.min(...sizePrices) : 0)
    : product.price || 0;

  const isInStock = hasVariants
    ? activeSizes.some((s) => s.stock > 0)
    : (product.stock ?? 0) > 0;

  const haptic = useHaptic();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic('light');
    router.push(`/product/${product.slug}`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic('light');
    await toggle(product.id);
  };

  return (
    <div
      ref={inViewRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-[1rem] will-change-transform product-card-reveal"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? (isHovered ? 'translateY(0) scale(1.02)' : 'translateY(0) scale(1)') : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, box-shadow 0.3s ease-out',
        transitionDelay: inView && !isHovered ? `${index * 0.08}s` : '0s',
        boxShadow: isHovered 
          ? `0 30px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,169,110,0.3)` 
          : `0 0 0 1px rgba(200,169,110,0.12), 0 3px 12px rgba(200,169,110,0.04)`,
        zIndex: isHovered ? 50 : 1,
      }}
    >
      <Link prefetch={true} href={`/product/${product.slug}`}
        className="block product-card group"
        style={{ overflow: 'hidden', WebkitTouchCallout: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-[1rem] bg-luxe-gray">
          {images.length > 0 && images[imageIndex] ? (
            <div className="absolute inset-0">
              <Image
                key={images[imageIndex].url || imageIndex}
                src={images[imageIndex].url}
                alt={images[imageIndex].alt_text || product.name}
                fill
                crossOrigin="anonymous"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  'object-cover transition-opacity duration-700 protect-image pointer-events-none',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                style={{ animation: 'fadeIn 0.5s ease-in-out' }}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
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
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-20"
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


          {/* Badges - optimized to remove backdrop blur for mobile performance */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[75%]">
            {product.is_best_seller && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#1a150f]/90 border border-luxe-accent/30 text-luxe-accent text-[10px] font-semibold tracking-wider uppercase">Best Seller</span>
            )}
            {product.is_trending && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-black/70 border border-white/20 text-white text-[10px] font-semibold tracking-wider uppercase">Trending</span>
            )}
            {!isInStock && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#200505]/90 border border-red-500/30 text-red-400 text-[10px] font-semibold tracking-wider uppercase">Out of Stock</span>
            )}
          </div>

          {/* Wishlist button */}
          <Tooltip
            content={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            position="left"
            className={cn(
              'absolute top-2 right-2 z-10',
              'sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-200'
            )}
          >
            <button
              onClick={handleWishlist}
              className={cn(
                'p-2 rounded-full border transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center',
                wishlisted
                  ? 'bg-[#200505]/90 border-red-500/40 text-red-400'
                  : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
              )}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={cn('w-3.5 h-3.5', wishlisted && 'fill-current')} />
            </button>
          </Tooltip>

          {/* Add to cart */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 flex">
            <Tooltip 
              content={isInStock ? 'Quick Add' : 'Out of Stock'} 
              position="top" 
              className="w-full flex-1"
            >
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={cn(
                  'w-full py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 min-h-[36px]',
                  isInStock
                    ? 'bg-white text-black hover:bg-luxe-accent'
                    : 'bg-black/80 border border-white/10 text-white/50 cursor-not-allowed'
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {!isInStock
                  ? 'Out of Stock'
                  : (product.product_type || 'other') === 'poster'
                    ? 'Select Poster'
                    : `Select ${(product.product_type || 'other') === 'other' ? 'Option' : (product.product_type || 'other').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex flex-col justify-between h-[90px] sm:h-[104px]">
          <div>
            <p className="text-white/40 text-[10px] sm:text-[11px] mb-0.5 leading-none">{product.category?.name}</p>
            <h3 className="text-white text-xs sm:text-sm font-medium leading-snug line-clamp-2 group-hover:text-luxe-accent transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center h-6">
              {!isInStock ? (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/70 border border-white/20 text-white/80 text-[10px] font-semibold tracking-wider uppercase">
                  Coming Soon
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  {hasVariants && displayPrice > 0 && (
                    <span className="text-white/40 text-[10px] uppercase tracking-widest">From</span>
                  )}
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {displayPrice > 0 ? formatCurrency(displayPrice) : 'Coming Soon'}
                  </span>
                </div>
              )}
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
    </div>
  );
}