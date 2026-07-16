'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, ChevronLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useCouponStore } from '@/hooks/useCouponStore';
import { formatCurrency, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function CartView() {
  const { items, itemCount, subtotal, deliveryCharge, total, loading, updateQuantity, removeItem, deliverySettings } =
    useCart();
    
  const { appliedCoupon, setAppliedCoupon } = useCouponStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  
  const supabase = createClient();
  
  useEffect(() => {
    supabase.from('coupons').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setAvailableCoupons(data);
    });
  }, [supabase]);

  const applyCoupon = async (code: string = couponCode) => {
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).single();
      if (error || !coupon) throw new Error('Invalid coupon code');
      if (!coupon.is_active) throw new Error('This coupon is no longer active');
      if (subtotal < coupon.min_order_amount) throw new Error(`Minimum order of ₹${coupon.min_order_amount} required`);
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new Error('Coupon usage limit reached');
      
      setAppliedCoupon(coupon);
      setCouponCode('');
      toast.success('Coupon applied!');
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed');
  };

  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percentage' 
        ? Math.round((subtotal * appliedCoupon.discount_value) / 100) 
        : appliedCoupon.discount_value)
    : 0;
  
  const finalTotal = Math.max(0, total - discountAmount);

  // Auto-remove coupon if subtotal drops below minimum order amount
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.min_order_amount) {
      setAppliedCoupon(null);
      setCouponError('');
      toast.error(`Coupon removed: Minimum order of ₹${appliedCoupon.min_order_amount} required`);
    }
  }, [subtotal, appliedCoupon, setAppliedCoupon]);

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
          className="max-w-md mx-auto glass-card p-12"
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full bg-foreground/ border border-foreground/ shadow-[0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-6 relative"
          >
            <ShoppingBag className="w-10 h-10 text-foreground/" />
            <div className="absolute inset-0 rounded-full border border-foreground/ animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Your cart is empty</h2>
          <p className="text-foreground/ text-sm mb-8">
            Browse our collections and add something you love
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link prefetch={true} href="/category/poster" className="btn-luxe text-sm">
              Shop Posters
            </Link>
            <Link prefetch={true} href="/category/earring" className="btn-luxe-outline text-sm">
              Shop Earrings
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-foreground/ text-sm mb-10">
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
                    layout
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card p-4 md:p-5"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <Link prefetch={true} href={`/product/${item.product?.slug}`}
                        className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-card"
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
                          <div className="w-full h-full flex items-center justify-center text-foreground/">
                            ✦
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link prefetch={true} href={`/product/${item.product?.slug}`}
                          className="text-foreground text-sm font-medium hover:text-luxe-accent transition-colors line-clamp-2 mb-1"
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
                          <p className="text-foreground font-semibold">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </p>

                          {/* Quantity control */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-foreground/ text-foreground hover:bg-foreground/ active:scale-95 transition-all flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-foreground text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={
                                item.quantity >= (
                                  item.poster_size?.stock ?? item.product?.stock ?? 0
                                )
                              }
                              className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-foreground/ text-foreground hover:bg-foreground/ active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-foreground/ text-xs mt-1">
                          {formatCurrency(item.unit_price)} each
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-3 sm:p-2 rounded-lg text-foreground/ hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
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
              <Link prefetch={true} href="/category/poster"
                className="btn-glass !py-2 !px-4 text-sm group w-fit"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ─── Order Summary ─── */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-foreground font-semibold text-base mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/">
                    Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                  </span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/">Delivery</span>
                  <span className={cn('text-foreground', deliveryCharge === 0 && 'text-green-400')}>
                    {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                  </span>
                </div>
                {deliveryCharge > 0 && (
                  <p className="text-foreground/ text-xs">
                    Add{' '}
                    <span className="text-luxe-accent">
                      {formatCurrency(deliverySettings.threshold - subtotal)}
                    </span>{' '}
                    more for free delivery
                  </p>
                )}
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Discount ({appliedCoupon.code})
                  </span>
                  <span className="text-green-400">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="border-t border-foreground/ pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-foreground font-semibold">Total</span>
                  <span className="text-foreground font-bold text-lg">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
              
              {/* Coupon Input */}
              <div className="mb-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {!appliedCoupon ? (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Discount code"
                        className="input-luxe flex-1 uppercase font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => applyCoupon()}
                        disabled={applyingCoupon || !couponCode}
                        className="px-4 rounded-xl bg-foreground/ hover:bg-foreground/ text-foreground text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-400 text-xs mb-3">{couponError}</p>}
                    
                    {availableCoupons.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-foreground/ text-[10px] uppercase tracking-wider mb-2">Available Coupons</p>
                        {availableCoupons.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCouponCode(c.code); applyCoupon(c.code); }}
                            className="w-full text-left p-2.5 rounded-xl border border-foreground/ hover:border-luxe-accent/50 hover:bg-foreground/ transition-all flex justify-between items-center group"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-luxe-accent group-hover:scale-110 transition-transform" />
                              <div>
                                <span className="text-foreground text-sm font-mono block">{c.code}</span>
                                <span className="text-foreground/ text-[10px] block">
                                  Min order: {formatCurrency(c.min_order_amount)}
                                </span>
                              </div>
                            </div>
                            <span className="text-luxe-accent text-xs font-semibold">
                              {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `-${formatCurrency(c.discount_value)}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm font-medium font-mono">{appliedCoupon.code}</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-foreground/ hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <Link prefetch={true} href="/checkout"
                className="w-full btn-gold flex items-center justify-center gap-2 text-sm"
              >
                Proceed to Order
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Delivery info */}
              <p className="text-foreground/ text-xs text-center mt-4">
                Orders delivered across Tamil Nadu via WhatsApp checkout
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
