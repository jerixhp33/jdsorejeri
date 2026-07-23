'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Share2,
  Star,
  Truck,
  Shield,
  Package,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Check,
  X,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useHaptic } from '@/hooks/useHaptic';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product, PosterSize, Review } from '@/types';
import { toast } from 'sonner';
import { VirtualTryOnModal } from './VirtualTryOnModal';
import { ReviewFormModal } from './ReviewFormModal';

interface ProductDetailProps {
  product: Product;
  reviews: Review[];
  initialBundleProduct?: Product | null;
}

export function ProductDetail({ product, reviews, initialBundleProduct }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, updateQuantity, items: cartItems, deliverySettings } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const v2Variants = (product.attributes as any)?._v2_variants;
    if (v2Variants?.options?.length > 0 && v2Variants.combinations?.length > 0) {
      const defaultCombo = v2Variants.combinations.find((c: any) => c.is_active) || v2Variants.combinations[0];
      return defaultCombo?.options || {};
    }
    return {};
  });

  const [selectedSize, setSelectedSize] = useState<PosterSize | null>(() => {
    const v2Variants = (product.attributes as any)?._v2_variants;
    if (v2Variants?.options?.length > 0 && v2Variants.combinations?.length > 0) {
      const defaultCombo = v2Variants.combinations.find((c: any) => c.is_active) || v2Variants.combinations[0];
      if (defaultCombo && product.sizes) {
        const label = Object.values(defaultCombo.options).join(' / ');
        return product.sizes.find(s => s.label === label) || product.sizes[0] || null;
      }
    }
    return product.sizes?.[0] || null;
  });

  const [bundleProduct, setBundleProduct] = useState<Product | null>(initialBundleProduct || null);
  const [addingBundle, setAddingBundle] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [showTryOn, setShowTryOn] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Adaptive aspect ratio: tracks the natural width/height of the loaded image
  const [imgAspect, setImgAspect] = useState<number | null>(null);

  const handleMainImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget as HTMLImageElement;
    if (el.naturalWidth && el.naturalHeight) {
      setImgAspect(el.naturalWidth / el.naturalHeight);
    }
  }, []);

  useEffect(() => {
    const v2Variants = (product.attributes as any)?._v2_variants;
    if (v2Variants?.options?.length > 0 && product.sizes && product.sizes.length > 0) {
      const combo = v2Variants.combinations?.find((c: any) => 
        Object.entries(selectedOptions).every(([k, v]) => c.options[k] === v)
      );
      if (combo) {
        const label = Object.values(combo.options).join(' / ');
        const matchedSize = product.sizes.find(s => s.label === label);
        if (matchedSize) setSelectedSize(matchedSize);
        else setSelectedSize(null);
      } else {
        setSelectedSize(null);
      }
    }
  }, [selectedOptions, product.sizes, product.attributes]);

  const images = product.images || [];
  const wishlisted = isWishlisted(product.id);
  const currentImage = images[selectedImage];

  const unitPrice =
    (product.sizes && product.sizes.length > 0 && selectedSize)
      ? selectedSize.price
      : (product.price ?? 0);

  // How many of this exact item (and size) are already in the cart?
  const cartQuantity = cartItems
    .filter(
      (item) =>
        item.product_id === product.id &&
        ((product.sizes && product.sizes.length > 0) ? item.poster_size_id === selectedSize?.id : true)
    )
    .reduce((sum, item) => sum + item.quantity, 0);

  const dbStock =
    (product.sizes && product.sizes.length > 0 && selectedSize)
      ? selectedSize.stock
      : (product.stock ?? 0);

  const availableStock = Math.max(0, dbStock - cartQuantity);
  const inStock = availableStock > 0;

  const handleNextImage = useCallback(() => {
    setImgAspect(null); // reset until new image loads
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handlePrevImage = useCallback(() => {
    setImgAspect(null); // reset until new image loads
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1 || showTryOn) return;
    const timer = setInterval(() => {
      handleNextImage();
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length, handleNextImage, showTryOn]);
  
  // Ensure quantity doesn't exceed newly selected size stock
  useEffect(() => {
    if (quantity > availableStock && availableStock > 0) {
      setQuantity(availableStock);
    }
  }, [availableStock, quantity]);

  const haptic = useHaptic();

  const handleAddToCart = async () => {
    const hasVariants = product.sizes && product.sizes.length > 0;
    if (hasVariants && !selectedSize) {
      toast.error('Please select an option');
      return;
    }
    if (!inStock || cartQuantity >= dbStock) return;
    
    haptic('medium');
    setAddingToCart(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      await addItem(product.id, unitPrice, quantity, hasVariants ? selectedSize?.id : undefined);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddBundle = async () => {
    if (!bundleProduct) return;
    haptic('medium');
    setAddingBundle(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      
      const hasVariants = product.sizes && product.sizes.length > 0;
      await addItem(product.id, unitPrice, quantity, hasVariants ? selectedSize?.id : undefined, true);
      
      const bundleHasVariants = bundleProduct.sizes && bundleProduct.sizes.length > 0;
      const bundlePrice = bundleHasVariants && bundleProduct.sizes?.[0] ? bundleProduct.sizes[0].price : (bundleProduct.price || 0);
      await addItem(bundleProduct.id, bundlePrice, 1, bundleHasVariants ? bundleProduct.sizes?.[0]?.id : undefined, true);
      
      toast.success('Bundle added to cart!');
    } finally {
      setAddingBundle(false);
    }
  };

  const handleWaitlist = async () => {
    setJoiningWaitlist(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          posterSizeId: (product.sizes && product.sizes.length > 0) ? selectedSize?.id : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          toast.error('Please log in to join the waitlist');
          return;
        }
        throw new Error(data.error || 'Failed to join waitlist');
      }
      setWaitlistJoined(true);
      toast.success('You have been added to the waitlist!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="page-container py-10 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ─── Image Gallery ─── */}
        <div className="space-y-4">
          {/* Main image — aspect ratio adapts to the actual image (A4, A3, square, etc.) */}
          <div
            className="relative rounded-2xl overflow-hidden bg-luxe-dark md:cursor-zoom-in"
            style={{
              aspectRatio: imgAspect ? String(imgAspect) : '4/5',
              maxHeight: '85vh',
            }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseEnter={() => { if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setZoomed(true); }}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
            onClick={() => { if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setZoomed(!zoomed); }}
          >
            <AnimatePresence mode="wait">
              {currentImage ? (
                <motion.div
                  key={currentImage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt_text || product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    style={{
                      transformOrigin: zoomed ? `${mousePos.x}% ${mousePos.y}%` : 'center',
                    }}
                    className={cn(
                      'object-contain transition-transform duration-200 ease-out protect-image pointer-events-none',
                      zoomed && 'scale-[1.75]'
                    )}
                    onLoad={handleMainImageLoad}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-white/10 text-8xl">✦</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Zoom hint */}
            <div className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/60">
              <ZoomIn className="w-4 h-4" />
            </div>

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white/60 text-xs z-10">
                  {selectedImage + 1} / {images.length}
                </div>
              )}

              {/* Virtual Try-On Button */}
              {product.product_type === 'poster' && currentImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTryOn(true);
                  }}
                  className="absolute bottom-3 left-3 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold shadow-lg hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-10"
                >
                  <Package className="w-4 h-4" />
                  See it on your wall
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage === i
                        ? 'border-luxe-accent'
                        : 'border-white/10 hover:border-white/30'
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt_text || `View ${i + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Product Info ─── */}
          <div className="flex flex-col">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="btn-glass !py-2 !px-4 text-sm mb-5 w-fit group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>

            {/* Category + tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {product.category && (
                <span className="badge-luxe text-xs">{product.category.name}</span>
              )}
              {product.is_best_seller && (
                <span className="badge-gold text-xs">Best Seller</span>
              )}
              {product.is_trending && (
                <span className="badge-luxe text-xs">Trending</span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.floor(averageRating)
                          ? 'text-luxe-accent fill-current'
                          : 'text-white/20'
                      )}
                    />
                  ))}
                </div>
                <span className="text-white/60 text-sm">
                  {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl font-bold text-white">
                {formatCurrency(unitPrice)}
              </span>
              {(product.sizes && product.sizes.length > 0 && selectedSize) && (
                <span className="text-white/40 text-sm">for {selectedSize.label}</span>
              )}
            </div>

            {/* ── Variant Selector ── */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                {(() => {
                  const v2Variants = (product.attributes as any)?._v2_variants;
                  const hasMatrixVariants = v2Variants?.options?.length > 0 && v2Variants?.combinations?.length > 0;

                  if (hasMatrixVariants) {
                    return (
                      <div className="space-y-5">
                        {v2Variants.options.map((opt: any) => (
                          <div key={opt.id}>
                            <p className="text-white/70 text-sm font-medium mb-3">
                              Select {opt.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {opt.values.map((val: string) => {
                                const isSelected = selectedOptions[opt.name] === val;
                                // Check if this combination exists and has stock
                                const testOptions = { ...selectedOptions, [opt.name]: val };
                                const combo = v2Variants.combinations.find((c: any) => 
                                  Object.entries(testOptions).every(([k, v]) => c.options[k] === v)
                                );
                                
                                // To get stock and price, we must match it against poster_sizes
                                let matchedSize = null;
                                if (combo) {
                                  const label = Object.values(combo.options).join(' / ');
                                  matchedSize = product.sizes?.find(s => s.label === label);
                                }
                                
                                const stock = matchedSize?.stock || 0;
                                const isOutOfStock = stock === 0;

                                return (
                                  <button
                                    key={val}
                                    onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                                    disabled={!combo}
                                    className={cn(
                                      'flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                                      !combo
                                        ? 'border-white/5 text-white/10 cursor-not-allowed hidden' // combination doesn't exist
                                        : isSelected
                                          ? 'border-luxe-accent bg-luxe-accent/10 text-luxe-accent'
                                          : 'border-white/15 text-white/70 hover:border-white/40'
                                    )}
                                  >
                                    <span>{val}</span>
                                    {isSelected && matchedSize && (
                                      <span className="text-[10px] mt-0.5 opacity-70">
                                        {isOutOfStock ? 'Out' : formatCurrency(matchedSize.price)}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // Fallback for legacy poster sizes
                  return (
                    <div>
                      <p className="text-white/70 text-sm font-medium mb-3">
                        Select Option
                        {selectedSize && product.product_type === 'poster' && (
                          <span className="text-white/40 ml-2">
                            ({selectedSize.width_cm} × {selectedSize.height_cm} cm)
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSelectedSize(size)}
                            disabled={size.stock === 0}
                            className={cn(
                              'flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                              size.stock === 0
                                ? 'border-white/10 text-white/20 cursor-not-allowed'
                                : selectedSize?.id === size.id
                                  ? 'border-luxe-accent bg-luxe-accent/10 text-luxe-accent'
                                  : 'border-white/15 text-white/70 hover:border-white/40'
                            )}
                          >
                            <span>{size.label}</span>
                            <span className="text-[10px] mt-0.5 opacity-70">
                              {size.stock === 0 ? 'Out' : formatCurrency(size.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Attributes - Moved to Accordion */}

            {/* Add to Cart / Quantity Selector */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-3 h-[52px]">
                {dbStock === 0 ? (
                  <button 
                    onClick={handleWaitlist}
                    disabled={joiningWaitlist || waitlistJoined}
                    className="w-full h-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
                  >
                    {joiningWaitlist ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : waitlistJoined ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                    {waitlistJoined ? 'You\'re on the list!' : 'Notify Me When Available'}
                  </button>
                ) : cartQuantity === 0 ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full h-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm bg-white text-black hover:bg-luxe-accent transition-all"
                  >
                    {addingToCart ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-between glass-card rounded-xl overflow-hidden border border-luxe-accent/50 bg-luxe-accent/5 shadow-[0_0_15px_rgba(200,169,110,0.1)]">
                    <button
                      onClick={() => updateQuantity(cartItems.find(i => i.product_id === product.id && ((product.sizes && product.sizes.length > 0) ? i.poster_size_id === selectedSize?.id : true))!.id, cartQuantity - 1)}
                      className="h-full px-6 text-white hover:text-luxe-accent hover:bg-white/5 active:scale-95 transition-all text-xl"
                    >
                      −
                    </button>
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-white text-base font-bold">{cartQuantity}</span>
                      <span className="text-luxe-accent/80 text-[10px] uppercase tracking-wider font-semibold -mt-1">In Cart</span>
                    </div>
                    <button
                      onClick={() => {
                        if (cartQuantity >= availableStock + cartQuantity) {
                          toast.error(`Only ${dbStock} left in stock`);
                        } else {
                          updateQuantity(cartItems.find(i => i.product_id === product.id && ((product.sizes && product.sizes.length > 0) ? i.poster_size_id === selectedSize?.id : true))!.id, cartQuantity + 1);
                        }
                      }}
                      disabled={cartQuantity >= dbStock}
                      className="h-full px-6 text-white hover:text-luxe-accent hover:bg-white/5 active:scale-95 transition-all text-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
              
              {/* Low stock warning */}
              {inStock && availableStock <= 10 && availableStock > 0 && (
                <p className="text-red-400 text-xs font-medium ml-1">
                  ⏳ Hurry! Only {availableStock} item{availableStock !== 1 ? 's' : ''} left in stock.
                </p>
              )}
            </div>

            {/* Bundle UI */}
            {bundleProduct && (
              <div className="mb-8 p-5 rounded-2xl border border-luxe-accent/20 bg-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Package className="w-24 h-24 text-luxe-accent" />
                </div>
                
                <h3 className="text-sm font-semibold text-luxe-accent uppercase tracking-wider mb-4 relative z-10">
                  Frequently Bought Together
                </h3>
                
                <div className="flex items-center gap-4 relative z-10">
                  {bundleProduct.images?.[0]?.url && (
                    <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/50">
                      <Image
                        src={bundleProduct.images[0].url}
                        alt={bundleProduct.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white text-base font-medium leading-tight">{bundleProduct.name}</p>
                    <p className="text-white/60 text-sm mt-1">{formatCurrency(bundleProduct.sizes && bundleProduct.sizes.length > 0 ? bundleProduct.sizes[0].price : (bundleProduct.price || 0))}</p>
                  </div>
                  
                  <button
                    onClick={handleAddBundle}
                    disabled={addingBundle}
                    className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-luxe-accent text-black hover:bg-white hover:text-black transition-all"
                  >
                    {addingBundle ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                    {addingBundle ? 'Adding...' : 'Add Bundle'}
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist + Share */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => { haptic('light'); toggle(product.id); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-full border text-sm font-medium transition-all backdrop-blur-md',
                  wishlisted
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white'
                )}
              >
                <Heart className={cn('w-4 h-4', wishlisted && 'fill-current')} />
                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Product Details Accordion */}
            <div className="mt-8 space-y-3">
              {/* Description Accordion */}
              <div className="glass-card overflow-hidden">
                <button 
                  onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-white">Description</span>
                  <ChevronRight className={cn('w-4 h-4 transition-transform text-white/50', openAccordion === 'description' && 'rotate-90 text-luxe-accent')} />
                </button>
                <AnimatePresence>
                  {openAccordion === 'description' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 text-white/55 text-sm leading-relaxed">
                        {product.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Details Accordion */}
              <div className="glass-card overflow-hidden">
                <button 
                  onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-white">Specifications</span>
                  <ChevronRight className={cn('w-4 h-4 transition-transform text-white/50', openAccordion === 'details' && 'rotate-90 text-luxe-accent')} />
                </button>
                <AnimatePresence>
                  {openAccordion === 'details' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                        {product.material && (
                          <div className="glass-card-sm p-3">
                            <p className="text-white/30 text-[11px] uppercase tracking-wide mb-0.5">Material</p>
                            <p className="text-white text-sm font-medium">{product.material}</p>
                          </div>
                        )}
                        {product.product_type === 'poster' && product.finish && (
                          <div className="glass-card-sm p-3">
                            <p className="text-white/30 text-[11px] uppercase tracking-wide mb-0.5">Finish</p>
                            <p className="text-white text-sm font-medium capitalize">{product.finish}</p>
                          </div>
                        )}
                        {product.product_type === 'poster' && product.orientation && (
                          <div className="glass-card-sm p-3">
                            <p className="text-white/30 text-[11px] uppercase tracking-wide mb-0.5">Orientation</p>
                            <p className="text-white text-sm font-medium capitalize">{product.orientation}</p>
                          </div>
                        )}
                        {product.product_type === 'earring' && product.color && (
                          <div className="glass-card-sm p-3">
                            <p className="text-white/30 text-[11px] uppercase tracking-wide mb-0.5">Color</p>
                            <p className="text-white text-sm font-medium">{product.color}</p>
                          </div>
                        )}
                        {product.product_type === 'earring' && product.weight_grams && (
                          <div className="glass-card-sm p-3">
                            <p className="text-white/30 text-[11px] uppercase tracking-wide mb-0.5">Weight</p>
                            <p className="text-white text-sm font-medium">{product.weight_grams}g</p>
                          </div>
                        )}
                        {product.attributes && Object.entries(product.attributes)
                          .filter(([key, value]) => !key.startsWith('_') && typeof value !== 'object')
                          .map(([key, value]) => (
                          <div key={key} className="glass-card-sm p-3">
                            <p className="text-white/30 text-[11px] uppercase tracking-wide mb-0.5">{key}</p>
                            <p className="text-white text-sm font-medium">{value as React.ReactNode}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shipping Accordion */}
              <div className="glass-card overflow-hidden">
                <button 
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-white">Shipping & Returns</span>
                  <ChevronRight className={cn('w-4 h-4 transition-transform text-white/50', openAccordion === 'shipping' && 'rotate-90 text-luxe-accent')} />
                </button>
                <AnimatePresence>
                  {openAccordion === 'shipping' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <Truck className="w-4 h-4 text-luxe-accent flex-shrink-0" />
                          Delivered across Tamil Nadu in 3–5 business days
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          Free delivery on orders above {formatCurrency(deliverySettings.threshold)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <Shield className="w-4 h-4 text-luxe-accent flex-shrink-0" />
                          Easy 7-day returns
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <Package className="w-4 h-4 text-luxe-accent flex-shrink-0" />
                          Securely packaged with premium materials
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge-luxe text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-12 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl font-bold text-white">
              Customer Reviews ({reviews.length})
            </h2>
            {reviews.length > 0 && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="btn-luxe px-6 py-2.5 text-sm w-full sm:w-auto"
              >
                Write a Review
              </button>
            )}
          </div>

          {reviews.length > 0 ? (
            <>

            {/* Rating summary */}
            <div className="flex items-center gap-6 mb-10 p-6 glass-card">
              <div className="text-center">
                <p className="font-display text-5xl font-bold text-white">
                  {averageRating.toFixed(1)}
                </p>
                <div className="flex items-center gap-1 justify-center my-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.floor(averageRating)
                          ? 'text-luxe-accent fill-current'
                          : 'text-white/20'
                      )}
                    />
                  ))}
                </div>
                <p className="text-white/40 text-xs">{reviews.length} reviews</p>
              </div>
            </div>

            {/* Review list */}
            <div className="space-y-5">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-luxe-accent/20 flex items-center justify-center">
                        <span className="text-luxe-accent text-xs font-semibold">
                          {((review.user as any)?.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {(review.user as any)?.name || 'Verified Customer'}
                        </p>
                        {review.is_verified && (
                          <span className="text-green-400 text-[10px] flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3.5 h-3.5',
                            i < review.rating ? 'text-luxe-accent fill-current' : 'text-white/20'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <p className="text-white text-sm font-medium mb-1">{review.title}</p>
                  )}
                  {review.body && (
                    <p className="text-white/55 text-sm leading-relaxed mb-3">{review.body}</p>
                  )}
                  {review.image_url && (
                    <div className="mt-3 relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group cursor-pointer">
                      <Image src={review.image_url} alt="Review Image" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setLightboxImage(review.image_url || null)}
                        className="absolute inset-0 z-10 focus:outline-none" 
                        aria-label="View full image"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-display font-medium text-white mb-2">No Reviews Yet</h3>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                Be the first to share your thoughts on {product.name}. Your feedback helps other customers make better choices!
              </p>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="btn-luxe px-8 py-3"
              >
                Write a Review
              </button>
            </div>
          )}
        </div>

        {/* Virtual Try-On Modal */}
        {currentImage && (
          <VirtualTryOnModal 
            isOpen={showTryOn}
            onClose={() => setShowTryOn(false)}
            posterUrl={currentImage.url}
            currentProduct={product}
          />
        )}

        {/* Review Form Modal */}
        <ReviewFormModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          productId={product.id}
          productName={product.name}
          onSuccess={() => router.refresh()}
        />

        {/* Image Lightbox */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
              onClick={() => setLightboxImage(null)}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 left-4 sm:top-8 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
                aria-label="Close lightbox"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div 
                className="relative w-full max-w-5xl h-full sm:h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image wrapper
              >
                <Image
                  src={lightboxImage}
                  alt="Full review image"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={100}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }