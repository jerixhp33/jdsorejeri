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
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product, PosterSize, Review } from '@/types';
import { toast } from 'sonner';
import { VirtualTryOnModal } from './VirtualTryOnModal';

interface ProductDetailProps {
  product: Product;
  reviews: Review[];
}

export function ProductDetail({ product, reviews }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, updateQuantity, items: cartItems } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<PosterSize | null>(
    product.sizes?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [showTryOn, setShowTryOn] = useState(false);
  
  // Adaptive aspect ratio: tracks the natural width/height of the loaded image
  const [imgAspect, setImgAspect] = useState<number | null>(null);

  const handleMainImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget as HTMLImageElement;
    if (el.naturalWidth && el.naturalHeight) {
      setImgAspect(el.naturalWidth / el.naturalHeight);
    }
  }, []);

  const images = product.images || [];
  const wishlisted = isWishlisted(product.id);
  const currentImage = images[selectedImage];

  const unitPrice =
    product.product_type === 'poster'
      ? (selectedSize?.price ?? 0)
      : (product.price ?? 0);

  // How many of this exact item (and size) are already in the cart?
  const cartQuantity = cartItems
    .filter(
      (item) =>
        item.product_id === product.id &&
        (product.product_type === 'poster' ? item.poster_size_id === selectedSize?.id : true)
    )
    .reduce((sum, item) => sum + item.quantity, 0);

  const dbStock =
    product.product_type === 'poster'
      ? (selectedSize?.stock ?? 0)
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
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      handleNextImage();
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length, handleNextImage]);
  
  // Ensure quantity doesn't exceed newly selected size stock
  useEffect(() => {
    if (quantity > availableStock && availableStock > 0) {
      setQuantity(availableStock);
    }
  }, [availableStock, quantity]);

  const handleAddToCart = async () => {
    if (product.product_type === 'poster' && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    setAddingToCart(true);
    await addItem(
      product.id,
      unitPrice,
      1,
      product.product_type === 'poster' ? selectedSize?.id : undefined
    );
    setAddingToCart(false);
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
                      'object-contain transition-transform duration-200 ease-out',
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
                  className="absolute bottom-3 left-3 px-4 py-2.5 rounded-xl bg-luxe-accent text-black font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 z-10"
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
              {product.product_type === 'poster' && selectedSize && (
                <span className="text-white/40 text-sm">for {selectedSize.label}</span>
              )}
            </div>

            {/* Description - We'll move this to Accordion below */}

            {/* ── Size selector (Posters only) ── */}
            {product.product_type === 'poster' && product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <p className="text-white/70 text-sm font-medium mb-3">
                  Select Size
                  {selectedSize && (
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
            )}

            {/* Attributes - Moved to Accordion */}

            {/* Add to Cart / Quantity Selector */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-3 h-[52px]">
                {dbStock === 0 ? (
                  <button disabled className="w-full h-full rounded-xl font-semibold text-sm bg-white/10 text-white/30 cursor-not-allowed">
                    Out of Stock
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
                      onClick={() => updateQuantity(cartItems.find(i => i.product_id === product.id && (product.product_type === 'poster' ? i.poster_size_id === selectedSize?.id : true))!.id, cartQuantity - 1)}
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
                          updateQuantity(cartItems.find(i => i.product_id === product.id && (product.product_type === 'poster' ? i.poster_size_id === selectedSize?.id : true))!.id, cartQuantity + 1);
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

            {/* Wishlist + Share */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => toggle(product.id)}
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
                          Free delivery on orders above ₹999
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
        {reviews.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <h2 className="font-display text-2xl font-bold text-white mb-8">
              Customer Reviews ({reviews.length})
            </h2>

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
                    <p className="text-white/55 text-sm leading-relaxed">{review.body}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Virtual Try-On Modal */}
        {currentImage && (
          <VirtualTryOnModal 
            isOpen={showTryOn}
            onClose={() => setShowTryOn(false)}
            posterUrl={currentImage.url}
          />
        )}
      </div>
    );
  }