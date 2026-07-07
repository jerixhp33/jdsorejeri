'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, User, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import {
  formatCurrency,
  generateWhatsAppMessage,
  openWhatsApp,
  validatePincode,
  TAMIL_NADU_DISTRICTS,
} from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  alternate_phone: z.string().optional().refine(
    (val) => !val || /^[6-9]\d{9}$/.test(val), 'Enter a valid mobile number'
  ),
  email: z.string().email('Enter a valid email'),
  house_no: z.string().min(1, 'House/flat number is required'),
  street: z.string().min(3, 'Street is required'),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(1, 'Please select a district'),
  pincode: z.string().refine(validatePincode, 'Enter a valid 6-digit pincode'),
  landmark: z.string().optional(),
  delivery_notes: z.string().optional(),
  delivery_instructions: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999';

export function CheckoutForm() {
  const { items, subtotal, deliveryCharge, total, clearCart } = useCart();
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: profile?.name || '',
      email: profile?.email || '',
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    if (!profile || items.length === 0) {
      toast.error('Please add items to your cart first');
      return;
    }
    setSubmitting(true);
    try {
      const ordNum = `LX${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2,6).toUpperCase()}`;

      const { data: address, error: addrErr } = await supabase
        .from('delivery_addresses')
        .insert({
          user_id: profile.id,
          full_name: data.full_name,
          phone: data.phone,
          alternate_phone: data.alternate_phone || null,
          house_no: data.house_no,
          street: data.street,
          area: data.area,
          city: data.city,
          district: data.district,
          pincode: data.pincode,
          landmark: data.landmark || null,
        })
        .select().single();
      if (addrErr) throw addrErr;

      const fullAddress = [data.house_no, data.street, data.area, data.city, data.pincode,
        data.landmark ? `Near: ${data.landmark}` : ''
      ].filter(Boolean).join(', ');

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: ordNum,
          user_id: profile.id,
          status: 'pending',
          delivery_address_id: address.id,
          subtotal,
          delivery_charge: deliveryCharge,
          total,
          delivery_notes: data.delivery_notes || null,
          delivery_instructions: data.delivery_instructions || null,
          whatsapp_sent: false,
        })
        .select().single();
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase.from('order_items').insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          poster_size_id: item.poster_size_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
        }))
      );
      if (itemsErr) throw itemsErr;

      const whatsappMsg = generateWhatsAppMessage({
        customer_name: data.full_name,
        phone: data.phone,
        address: fullAddress,
        district: data.district,
        items: items.map((item) => ({
          name: item.product?.name || 'Product',
          size: (item.poster_size as { label?: string } | null)?.label,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        subtotal,
        delivery_charge: deliveryCharge,
        total,
        notes: data.delivery_notes,
      });

      await supabase.from('orders').update({
        whatsapp_sent: true,
        whatsapp_message: decodeURIComponent(whatsappMsg),
      }).eq('id', order.id);

      await supabase.from('activity_logs').insert({
        user_id: profile.id,
        action: 'order_created',
        entity_type: 'order',
        entity_id: order.id,
        details: { order_number: ordNum, total },
      });

      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Order Placed Successfully!',
        body: `Your order ${ordNum} has been placed. We'll confirm it via WhatsApp soon.`,
        type: 'order',
        action_url: '/dashboard/orders',
      });

      await clearCart();
      setOrderNumber(ordNum);
      setOrderPlaced(true);
      setTimeout(() => openWhatsApp(WHATSAPP_NUMBER, whatsappMsg), 500);
    } catch (err: unknown) {
      console.error('Order error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-white/50 mb-6">Your cart is empty</p>
        <Link href="/" className="btn-gold">Back to Shop</Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="page-container py-24 text-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)' }}>
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Order Placed!</h1>
          <p className="text-white/40 text-sm mb-1">Order #{orderNumber}</p>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            WhatsApp has opened with your order details. Send the message to confirm.
          </p>
          <div className="glass-card p-5 mb-8 text-left">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-3">What happens next</p>
            <div className="space-y-3">
              {['Send the WhatsApp message to our team', 'We confirm your order within 1 hour',
                'Your items are packed and dispatched', 'Delivered in 3–5 business days'].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold"
                    style={{ background: 'rgba(200,169,110,0.2)', color: '#c8a96e' }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/orders" className="btn-gold flex-1 text-center text-sm">View My Orders</Link>
            <Link href="/" className="btn-luxe-outline flex-1 text-center text-sm">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 md:py-16">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cart" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">Delivery Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-luxe-accent" />
              <h2 className="text-white font-semibold text-sm">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'full_name', label: 'Full Name *', placeholder: 'Your full name', type: 'text' },
                { name: 'email', label: 'Email *', placeholder: 'your@email.com', type: 'email' },
                { name: 'phone', label: 'Phone *', placeholder: '10-digit mobile', type: 'text', maxLength: 10 },
                { name: 'alternate_phone', label: 'Alternate Phone', placeholder: 'Optional', type: 'text', maxLength: 10 },
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">{field.label}</label>
                  <input
                    {...register(field.name as keyof CheckoutFormData)}
                    type={field.type}
                    className="input-luxe"
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                  />
                  {errors[field.name as keyof CheckoutFormData] && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors[field.name as keyof CheckoutFormData]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-4 h-4 text-luxe-accent" />
              <h2 className="text-white font-semibold text-sm">Delivery Address</h2>
              <span className="badge-gold text-[10px]">Tamil Nadu Only</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'house_no', label: 'House / Flat No *', placeholder: 'e.g. 12A, 3rd Floor' },
                { name: 'street',   label: 'Street *',          placeholder: 'Street name' },
                { name: 'area',     label: 'Area *',            placeholder: 'Area / Locality' },
                { name: 'city',     label: 'City *',            placeholder: 'City' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">{field.label}</label>
                  <input {...register(field.name as keyof CheckoutFormData)} className="input-luxe" placeholder={field.placeholder} />
                  {errors[field.name as keyof CheckoutFormData] && (
                    <p className="text-red-400 text-xs mt-1">{errors[field.name as keyof CheckoutFormData]?.message}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">District *</label>
                <select {...register('district')} className="input-luxe">
                  <option value="">Select District</option>
                  {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district.message}</p>}
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Pincode *</label>
                <input {...register('pincode')} className="input-luxe" placeholder="6-digit pincode" maxLength={6} />
                {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Nearby Landmark</label>
                <input {...register('landmark')} className="input-luxe" placeholder="e.g. Near SBI Bank" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-6">
            <h2 className="text-white font-semibold text-sm mb-5">Additional Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Delivery Notes</label>
                <textarea {...register('delivery_notes')} className="input-luxe resize-none" rows={2} placeholder="Any special instructions for delivery..." />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Order Notes</label>
                <textarea {...register('delivery_instructions')} className="input-luxe resize-none" rows={2} placeholder="Gift wrapping, custom framing requests, etc." />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-gold w-full flex items-center justify-center gap-3 py-4">
            {submitting
              ? <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              : <MessageCircle className="w-5 h-5" />
            }
            {submitting ? 'Processing...' : 'Place Order via WhatsApp'}
          </button>
        </form>

        {/* Summary */}
        <div>
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-white font-semibold mb-5">Order Summary</h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-white/60 flex-1 truncate pr-2">
                    {item.product?.name}
                    {(item.poster_size as { label?: string } | null)?.label && ` · ${(item.poster_size as { label: string }).label}`}
                    {item.quantity > 1 && ` ×${item.quantity}`}
                  </span>
                  <span className="text-white flex-shrink-0">{formatCurrency(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-green-400' : 'text-white'}>
                  {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-white">Total</span>
                <span className="text-white text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="mt-5 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#4ade80' }}>
                <MessageCircle className="w-3.5 h-3.5" />
                Order via WhatsApp — no payment required upfront
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
