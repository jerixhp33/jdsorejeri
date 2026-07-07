'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatCurrency, cn } from '@/lib/utils';

export function CartView() {
  const { items, itemCount, subtotal, deliveryCharge, total, loading, updateQuantity, removeItem } =
    useCart();

  if (loading) {
    return (
      <div className="page-container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-32 skeleton rounded mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 flex gap-4">
                  <div className="w-20 h-20 skeleton rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                    <div className="h-5 w-16 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm mx-auto"
        >
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Your cart is empty</h2>
          <p className="text-white/40 text-sm mb-8">
            Browse our collections and add something you love
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/posters" className="btn-luxe text-sm">
              Shop Posters
            </Link>
            <Link href="/earrings" className="btn-luxe-outline text-sm">
              Shop Earrings
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Shopping Cart</h1>
        <p className="text-white/40 text-sm mb-10">
          {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Cart Items ─── */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const primaryImage =
                  (item.product?.images as { url: string; is_primary: boolean }[])?.find(
                    (img) => img.is_primary
                  ) ||
                  (item.product?.images as { url: string }[])?.[0];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0 }}
                    className="glass-card p-4 md:p-5"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <Link
                        href={`/product/${item.product?.slug}`}
                        className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-luxe-dark"
                      >
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={item.product?.name || 'Product'}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            ✦
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.product?.slug}`}
                          className="text-white text-sm font-medium hover:text-luxe-accent transition-colors line-clamp-2 mb-1"
                        >
                          {item.product?.name}
                        </Link>

                        {/* Size badge */}
                        {item.poster_size && (
                          <span className="badge-luxe text-[10px] mb-2">
                            {item.poster_size.label}
                          </span>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Price */}
                          <p className="text-white font-semibold">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </p>

                          {/* Quantity control */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-white text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={
                                item.quantity >= (
                                  item.poster_size?.stock ?? item.product?.stock ?? 0
                                )
                              }
                              className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-white/30 text-xs mt-1">
                          {formatCurrency(item.unit_price)} each
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Continue shopping */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/posters"
                className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* ─── Order Summary ─── */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-white font-semibold text-base mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">
                    Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                  </span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Delivery</span>
                  <span className={cn('text-white', deliveryCharge === 0 && 'text-green-400')}>
                    {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                  </span>
                </div>
                {deliveryCharge > 0 && (
                  <p className="text-white/30 text-xs">
                    Add{' '}
                    <span className="text-luxe-accent">
                      {formatCurrency(999 - subtotal)}
                    </span>{' '}
                    more for free delivery
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-bold text-lg">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full btn-gold flex items-center justify-center gap-2 text-sm"
              >
                Proceed to Order
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Delivery info */}
              <p className="text-white/30 text-xs text-center mt-4">
                Orders delivered across Tamil Nadu via WhatsApp checkout
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}