'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
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

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const secondaryImage = product.images?.[1];
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
      whileHover={{ y: -6 }}
      /* 
        overflow:visible so the adaptive glow bloom bleeds into the background.
        The inner Link/.product-card handles overflow:hidden for image clipping.
        We move the border + edge-light onto this wrapper instead of product-card
        so the ::before mask works correctly without being clipped.
      */
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
      <Link
        href={`/product/${product.slug}`}
        className="block product-card group"
        style={glowColor ? {
          borderColor: `rgba(${glowColor},0.4)`,
          transition: 'border-color 0.7s ease',
          overflow: 'hidden',
        } : { overflow: 'hidden' }}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-[1rem] bg-luxe-gray">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                fill
                crossOrigin="anonymous"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  'object-cover transition-all duration-700',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                  secondaryImage && 'group-hover:opacity-0'
                )}
                onLoad={(e) => {
                  setImageLoaded(true);
                  sampleImageColor(e.currentTarget as unknown as HTMLImageElement);
                }}
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage.url}
                  alt={secondaryImage.alt_text || product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-luxe-gray">
              <span className="text-white/20 text-4xl">✦</span>
            </div>
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
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_best_seller && (
              <span className="badge-luxe text-[10px]">Best Seller</span>
            )}
            {product.is_trending && (
              <span className="badge-luxe text-[10px]">Trending</span>
            )}
            {!isInStock && (
              <span className="badge-luxe !bg-red-500/20 !text-red-400 !border-red-500/30 text-[10px]">
                Out of Stock
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleWishlist}
              className={cn(
                'p-2 rounded-full backdrop-blur-md border transition-all duration-200',
                wishlisted
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-black/40 border-white/20 text-white hover:bg-white/20'
              )}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={cn('w-4 h-4', wishlisted && 'fill-current')} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/product/${product.slug}`);
              }}
              className="p-2 rounded-full backdrop-blur-md bg-black/40 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Add to cart button */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock || addingToCart}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200',
                isInStock
                  ? 'bg-white text-black hover:bg-luxe-accent'
                  : 'bg-white/20 text-white/40 cursor-not-allowed'
              )}
            >
              <ShoppingCart className="w-4 h-4" />
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
        <div className="p-4">
          <p className="text-white/40 text-xs mb-1">{product.category?.name}</p>
          <h3 className="text-white text-sm font-medium leading-snug mb-2 line-clamp-2 group-hover:text-luxe-accent transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-semibold text-base">
                {formatCurrency(displayPrice)}
              </span>
              {product.product_type === 'poster' && (
                <span className="text-white/30 text-xs ml-1">from</span>
              )}
            </div>
            {(product.average_rating ?? 0) > 0 && (
              <div className="flex items-center gap-1">
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