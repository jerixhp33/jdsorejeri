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
import { useFlashSale } from '@/hooks/useFlashSale';
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
  const { getProductSalePrice } = useFlashSale();
  
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

  const originalPrice = hasVariants
    ? (sizePrices.length > 0 ? Math.min(...sizePrices) : 0)
    : product.price || 0;

  const salePrice = getProductSalePrice(product.id, originalPrice);
  const displayPrice = salePrice ?? originalPrice;

  const isInStock = hasVariants
    ? activeSizes.some((s) => s.stock > 0)
    : (product.stock ?? 0) > 0;

  const haptic = useHaptic();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingToCart || !isInStock) return;
    setAddingToCart(true);

    try {
      haptic('medium');
      if (hasVariants) {
        router.push(`/product/${product.slug}`);
      } else {
        await addItem(product.id, displayPrice, 1);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic('light');
    toggle(product.id);
  };

  return (
    <div
      ref={inViewRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-full flex flex-col rounded-2xl bg-luxe-card border border-white/10 hover:border-luxe-accent/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-luxe-accent/5"
    >
      <Link prefetch={true} href={`/product/${product.slug}`} className="flex flex-col h-full">
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#111]">
          {inView && currentImage ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt_text || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="w-full h-full bg-white/5 animate-pulse" />
          )}

          {/* Image Navigation */}
          {images.length > 1 && isHovered && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {salePrice && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-luxe-accent text-black text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                Sale
              </span>
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
        <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
          <div className="min-h-[46px] sm:min-h-[52px] flex flex-col justify-start">
            <p className="text-white/40 text-[10px] sm:text-[11px] mb-1 leading-none">{product.category?.name}</p>
            <h3 className="text-white text-xs sm:text-sm font-medium leading-snug line-clamp-2 group-hover:text-luxe-accent transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center h-6">
              {!isInStock ? (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/70 border border-white/20 text-white/80 text-[10px] font-semibold tracking-wider uppercase">
                  Coming Soon
                </span>
              ) : (
                <div className="flex flex-col">
                  {salePrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {formatCurrency(salePrice)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Included taxes</span>
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