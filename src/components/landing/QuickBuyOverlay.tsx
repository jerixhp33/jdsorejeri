'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useHaptic } from '@/hooks/useHaptic';
import { useFlashSale } from '@/hooks/useFlashSale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product } from '@/types';

interface QuickBuyOverlayProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickBuyOverlay({ product, onClose }: QuickBuyOverlayProps) {
  const { addItem } = useCart();
  const haptic = useHaptic();
  const { getProductSalePrice } = useFlashSale();
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = product?.images || [];
  const currentImage = images.length > 0 ? images[imageIndex] : null;

  const activeSizes = product?.sizes?.filter((s) => s.is_active !== false) ?? [];
  const hasVariants = activeSizes.length > 0;

  const selectedSize = activeSizes.find((s) => s.id === selectedSizeId);

  const originalPrice = selectedSize
    ? selectedSize.price
    : hasVariants
      ? (activeSizes.length > 0 ? Math.min(...activeSizes.map((s) => s.price).filter((p) => p > 0)) : 0)
      : product?.price || 0;

  const salePrice = product ? getProductSalePrice(product.id, originalPrice) : null;
  const displayPrice = salePrice ?? originalPrice;

  const stock = selectedSize ? selectedSize.stock : (product?.stock ?? 0);
  const isInStock = stock > 0;

  // Auto-select first size
  useEffect(() => {
    if (product && activeSizes.length > 0 && !selectedSizeId) {
      const firstInStock = activeSizes.find((s) => s.stock > 0);
      setSelectedSizeId(firstInStock?.id || activeSizes[0].id);
    }
  }, [product, activeSizes, selectedSizeId]);

  // Reset state when product changes
  useEffect(() => {
    setQuantity(1);
    setAdded(false);
    setImageIndex(0);
    setSelectedSizeId(null);
  }, [product?.id]);

  // Close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [product]);

  const handleAddToCart = useCallback(async () => {
    if (!product || adding || !isInStock) return;
    if (hasVariants && !selectedSizeId) return;

    setAdding(true);
    haptic('medium');

    try {
      await addItem(
        product.id,
        displayPrice,
        quantity,
        selectedSizeId || undefined,
      );
      setAdded(true);
      haptic('heavy');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      // error handled by addItem
    } finally {
      setAdding(false);
    }
  }, [product, adding, isInStock, hasVariants, selectedSizeId, addItem, displayPrice, quantity, haptic, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="quick-buy-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md mx-auto rounded-3xl bg-[#111]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden max-h-[78vh] sm:max-h-[90vh] flex flex-col mb-20 sm:mb-0"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {/* Product Image */}
              <div className="relative aspect-[3/4] w-full bg-black/50">
                {currentImage && (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt_text || product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 400px"
                    className="object-cover"
                    priority
                  />
                )}

                {/* Image dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageIndex(idx)}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full transition-all',
                          idx === imageIndex ? 'bg-white w-4' : 'bg-white/40'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5 space-y-4">
                {/* Title & Price */}
                <div>
                  <p className="text-white/40 text-xs mb-1">{product.category?.name}</p>
                  <h3 className="text-white text-lg font-semibold leading-snug">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-white">{formatCurrency(displayPrice)}</span>
                    {salePrice && (
                      <span className="text-sm text-white/40 line-through">{formatCurrency(originalPrice)}</span>
                    )}
                  </div>
                </div>

                {/* Size Selection */}
                {hasVariants && (
                  <div>
                    <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Select Size</p>
                    <div className="flex flex-wrap gap-2">
                      {activeSizes.map((size) => {
                        const isSelected = size.id === selectedSizeId;
                        const outOfStock = size.stock <= 0;
                        return (
                          <button
                            key={size.id}
                            onClick={() => {
                              if (!outOfStock) {
                                setSelectedSizeId(size.id);
                                setQuantity(1);
                                haptic('light');
                              }
                            }}
                            disabled={outOfStock}
                            className={cn(
                              'px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200',
                              isSelected
                                ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                                : outOfStock
                                  ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed line-through'
                                  : 'bg-white/5 border-white/10 text-white/80 hover:border-white/30'
                            )}
                          >
                            {size.label}
                            {!outOfStock && size.price > 0 && (
                              <span className="block text-[10px] mt-0.5 opacity-60">
                                {formatCurrency(getProductSalePrice(product.id, size.price) ?? size.price)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Quantity</p>
                  <div className="flex items-center gap-3 w-fit bg-white/5 border border-white/10 rounded-xl p-1">
                    <button
                      onClick={() => { setQuantity(Math.max(1, quantity - 1)); haptic('light'); }}
                      disabled={quantity <= 1}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-semibold text-sm w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => { setQuantity(Math.min(stock, quantity + 1)); haptic('light'); }}
                      disabled={quantity >= stock}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {stock > 0 && stock <= 5 && (
                    <p className="text-orange-400/80 text-[10px] mt-1.5 font-medium">Only {stock} left in stock!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="p-4 border-t border-white/5 bg-[#111]/98 backdrop-blur-xl">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || adding || (hasVariants && !selectedSizeId)}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                  added
                    ? 'bg-green-500 text-white'
                    : isInStock && (!hasVariants || selectedSizeId)
                      ? 'bg-white text-black hover:bg-luxe-accent active:scale-[0.98]'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    Added to Cart!
                  </>
                ) : adding ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : !isInStock ? (
                  'Out of Stock'
                ) : hasVariants && !selectedSizeId ? (
                  'Select a size'
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Add to Cart · {formatCurrency(displayPrice * quantity)}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
