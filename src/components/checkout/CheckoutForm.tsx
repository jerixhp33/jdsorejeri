'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MessageCircle, MapPin, User, ArrowLeft, Check, Trash2, Tag, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useCouponStore } from '@/hooks/useCouponStore';
import {
  cn,
  formatCurrency,
  generateWhatsAppMessage,
  openWhatsApp,
  validatePincode,
  TAMIL_NADU_DISTRICTS,
} from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { DeliveryAddress } from '@/types';

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

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919360490974';

export function CheckoutForm() {
  const { items, subtotal, deliveryCharge, total, clearCart } = useCart();
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // New states for enhancements
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [successWhatsappUrl, setSuccessWhatsappUrl] = useState('');
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0);
  const [placedOrderData, setPlacedOrderData] = useState<any>(null);

  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'whatsapp'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [utrSubmitted, setUtrSubmitted] = useState(false);



  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const { appliedCoupon, setAppliedCoupon } = useCouponStore();
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  const supabase = createClient();
  
  // Available Coupons
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('coupons').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setAvailableCoupons(data);
    });
  }, [supabase]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: profile?.name || '',
      email: profile?.email || '',
    },
  });



  const currentPincode = watch('pincode');

  // Auto-fill email when profile loads
  useEffect(() => {
    if (profile?.email) {
      setValue('email', profile.email, { shouldValidate: true });
    }
    if (profile?.name && !watch('full_name')) {
      setValue('full_name', profile.name, { shouldValidate: true });
    }
  }, [profile, setValue, watch]);

  const handleSelectSavedAddress = useCallback((addr: DeliveryAddress) => {
    setSelectedAddressId(addr.id);
    setShowForm(false);
    setValue('full_name', addr.full_name, { shouldValidate: true });
    setValue('phone', addr.phone, { shouldValidate: true });
    setValue('alternate_phone', addr.alternate_phone || '', { shouldValidate: true });
    setValue('house_no', addr.house_no, { shouldValidate: true });
    setValue('street', addr.street, { shouldValidate: true });
    setValue('area', addr.area, { shouldValidate: true });
    setValue('city', addr.city, { shouldValidate: true });
    setValue('district', addr.district, { shouldValidate: true });
    setValue('pincode', addr.pincode, { shouldValidate: true });
    setValue('landmark', addr.landmark || '', { shouldValidate: true });
  }, [setValue]);

  // Fetch saved addresses
  useEffect(() => {
    if (profile?.id) {
      supabase.from('delivery_addresses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            handleSelectSavedAddress(data[0]);
          }
        });
    }
  }, [profile?.id, supabase, handleSelectSavedAddress]);

  // Auto-fetch city and district based on pincode
  useEffect(() => {
    if (currentPincode && currentPincode.length === 6 && validatePincode(currentPincode)) {
      setIsFetchingPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${currentPincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            const city = postOffice.Block && postOffice.Block !== 'NA' ? postOffice.Block : postOffice.Division;
            const district = postOffice.District;
            
            // Fuzzy match district to our Tamil Nadu list (e.g. Kanchipuram -> Kancheepuram)
            const matchedDistrict = TAMIL_NADU_DISTRICTS.find(
              d => d.toLowerCase() === district.toLowerCase() 
                || district.toLowerCase().includes(d.toLowerCase())
                || d.toLowerCase().includes(district.toLowerCase())
            );
            
            if (city) setValue('city', city, { shouldValidate: true });
            if (matchedDistrict) {
              setValue('district', matchedDistrict as typeof TAMIL_NADU_DISTRICTS[number], { shouldValidate: true });
            }
          }
        })
        .catch(err => console.error('Pincode fetch error:', err))
        .finally(() => setIsFetchingPincode(false));
    }
  }, [currentPincode, setValue]);

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from('delivery_addresses').delete().eq('id', id);
      if (error) throw error;
      
      const newAddresses = savedAddresses.filter(a => a.id !== id);
      setSavedAddresses(newAddresses);
      
      if (selectedAddressId === id) {
        if (newAddresses.length > 0) {
          handleSelectSavedAddress(newAddresses[0]);
        } else {
          setSelectedAddressId(null);
          setShowForm(true);
        }
      }
      toast.success('Address deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete address');
    } finally {
      setAddressToDelete(null);
    }
  };

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

  const onSubmit = async (data: CheckoutFormData) => {
    if (!profile || items.length === 0) {
      toast.error('Please add items to your cart first');
      return;
    }
    setSubmitting(true);
    try {
      const ordNum = `LX${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2,6).toUpperCase()}`;

      let finalAddressId = selectedAddressId;

      if (showForm || !selectedAddressId) {
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
            latitude: null,
            longitude: null,
          })
          .select().single();
        if (addrErr) throw addrErr;
        finalAddressId = address.id;
      }

      const fullAddress = [data.house_no, data.street, data.area, data.city, data.pincode,
        data.landmark ? `Near: ${data.landmark}` : ''
      ].filter(Boolean).join(', ');

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: ordNum,
          user_id: profile.id,
          status: 'pending',
          delivery_address_id: finalAddressId,
          subtotal,
          delivery_charge: deliveryCharge,
          discount_amount: discountAmount,
          coupon_id: appliedCoupon?.id || null,
          total: finalTotal,
          delivery_notes: data.delivery_notes || null,
          delivery_instructions: data.delivery_instructions || null,
          whatsapp_sent: false,
        })
        .select().single();
      if (orderErr) throw orderErr;
      
      if (appliedCoupon) {
        await supabase.from('coupons').update({ used_count: appliedCoupon.used_count + 1 }).eq('id', appliedCoupon.id);
      }

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

      // Notify admins of new order asynchronously
      fetch('/api/admin/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          total: order.grand_total,
          customerName: data.full_name
        })
      }).catch(err => console.error('Failed to send admin notification:', err));

      const whatsappMsg = generateWhatsAppMessage({
        order_number: ordNum,
        customer_name: data.full_name,
        phone: data.phone,
        address: fullAddress,
        district: data.district,
        items: items.map((i) => ({
          name: i.product?.name || 'Item',
          size: (i.poster_size as { label?: string } | null)?.label,
          quantity: i.quantity,
          price: i.unit_price,
        })),
        subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon?.code,
        total: finalTotal,
        notes: data.delivery_notes,
      });

      await supabase.from('orders').update({
        whatsapp_sent: paymentMethod === 'whatsapp',
        whatsapp_message: decodeURIComponent(whatsappMsg),
      }).eq('id', order.id);

      await supabase.from('activity_logs').insert({
        user_id: profile.id,
        action: 'order_created',
        entity_type: 'order',
        entity_id: order.id,
        details: { order_number: ordNum, total: finalTotal },
      });

      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Order Placed Successfully!',
        body: `Your order ${ordNum} has been placed. We'll confirm it via WhatsApp soon.`,
        type: 'order',
        action_url: '/dashboard/orders',
      });

      // Send immediate web push notification with personalized time-based greeting
      try {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 16 ? 'Good afternoon' : 'Good evening';
        const personalTitle = `${greeting}, ${profile?.name || 'Customer'}! 🌅`;
        const personalBody = `Your order #${ordNum} at JD Store has been booked and is waiting for confirmation. Thank you!`;

        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: personalTitle,
            body: personalBody,
            url: '/dashboard/orders'
          })
        });
      } catch (pushErr) {
        console.error('Error sending checkout push:', pushErr);
      }

      setOrderNumber(ordNum);
      setPlacedOrderTotal(finalTotal);
      setCreatedOrderId(order.id);
      setPlacedOrderData({
        orderNumber: ordNum,
        customerName: data.full_name,
        phone: data.phone,
        address: fullAddress,
        items: items.map((i) => ({
          name: i.product?.name || 'Item',
          size: (i.poster_size as { label?: string } | null)?.label,
          quantity: i.quantity,
          price: i.unit_price,
          image: i.product?.images?.[0]?.url,
        })),
        subtotal,
        deliveryCharge,
        discountAmount,
        total: finalTotal,
      });
      setOrderPlaced(true);

      const cleanPhone = WHATSAPP_NUMBER.replace(/\D/g, '');
      const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      
      // Auto-open full message
      const fullMsgWaUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMsg)}`;
      
      // Success screen just sends the screenshot
      const screenshotMsg = `Hello, here is my payment screenshot for Order #${ordNum}`;
      const successWaUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(screenshotMsg)}`;
      setSuccessWhatsappUrl(successWaUrl);
      
      if (paymentMethod === 'whatsapp') {
        // Auto-open WhatsApp directly
        setTimeout(() => {
          window.location.href = fullMsgWaUrl;
        }, 100);
      }
      
      // Clear cart last to prevent race conditions with component unmounting
      await clearCart();
    } catch (err: any) {
      console.error('Order error:', err);
      toast.error(`Checkout Failed: ${err?.message || err?.details || JSON.stringify(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced && !submitting) {
    return (
      <div className="page-container py-24 text-center">
        <div className="max-w-md mx-auto glass-card p-12">
          <p className="text-white/50 mb-6">Your cart is empty</p>
          <Link prefetch={true} href="/" className="btn-glass !w-auto !px-8">
            <ChevronLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const submitUTR = async () => {
    if (utrNumber.length < 12) {
      toast.error('Please enter a valid 12-digit UTR number');
      return;
    }
    setUtrSubmitting(true);
    try {
      const res = await fetch('/api/orders/utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createdOrderId, utrNumber }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit UTR');
      
      toast.success('Payment verified successfully!');
      setUtrSubmitted(true);
      
      setTimeout(() => {
        window.location.href = '/dashboard/orders';
      }, 2000);
    } catch (err) {
      toast.error('Failed to submit UTR. Please try again.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  if (orderPlaced) {
    const upiId = 'manikandanjanani67@oksbi';
    const upiName = 'JD Store';
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${placedOrderTotal}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

    return (
      <>
        {/* Printable Receipt (Hidden on Screen, Visible on Print) */}
        {placedOrderData && (
          <div className="hidden print-receipt-container bg-white text-black p-8 min-h-screen">
            <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
              <h1 className="text-4xl font-serif font-bold text-black tracking-tight mb-2">JD Store</h1>
              <p className="text-gray-500 font-medium tracking-wide uppercase text-xs tracking-widest">Official Order Receipt</p>
            </div>
            
            <div className="flex justify-between mb-10">
              <div>
                <h3 className="font-bold text-lg mb-2 text-black uppercase tracking-wider text-xs">Billed To</h3>
                <p className="font-semibold text-lg text-black">{placedOrderData.customerName}</p>
                <p className="text-gray-700">{placedOrderData.phone}</p>
                <p className="max-w-xs text-gray-700 mt-1">{placedOrderData.address}</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg mb-2 text-black uppercase tracking-wider text-xs">Order Info</h3>
                <p className="text-gray-700">Order ID: <strong className="text-black">#{placedOrderData.orderNumber}</strong></p>
                <p className="text-gray-700">Date: <span className="font-medium text-black">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                <p className="text-gray-700">Status: <span className="text-amber-600 font-semibold uppercase">{placedOrderData.status || 'Processing'}</span></p>
              </div>
            </div>

            <table className="w-full text-left mb-10 border-collapse">
              <thead>
                <tr className="border-b-2 border-black/80">
                  <th className="py-3 text-black uppercase text-xs tracking-wider font-bold w-[50%]">Item Description</th>
                  <th className="py-3 text-center text-black uppercase text-xs tracking-wider font-bold">Qty</th>
                  <th className="py-3 text-right text-black uppercase text-xs tracking-wider font-bold">Price</th>
                  <th className="py-3 text-right text-black uppercase text-xs tracking-wider font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {placedOrderData.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200/60">
                    <td className="py-5 pr-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-base text-black leading-snug">{item.name}</p>
                          {item.size && <p className="text-sm text-gray-500 mt-0.5">Size: {item.size}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-center text-black font-medium">{item.quantity}</td>
                    <td className="py-5 text-right text-gray-700">{formatCurrency(item.price)}</td>
                    <td className="py-5 text-right font-bold text-black">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-16">
              <div className="w-72 space-y-3 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium text-black">{formatCurrency(placedOrderData.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>Delivery</span>
                  <span className="font-medium text-black">{placedOrderData.deliveryCharge === 0 ? 'FREE' : formatCurrency(placedOrderData.deliveryCharge)}</span>
                </div>
                {placedOrderData.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600 text-sm font-medium">
                    <span>Discount</span>
                    <span>-{formatCurrency(placedOrderData.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end text-xl font-black border-t-2 border-black/80 pt-4 mt-2 text-black">
                  <span className="text-base uppercase tracking-wider text-black">Grand Total</span>
                  <span>{formatCurrency(placedOrderData.total)}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
              <p className="font-serif italic text-lg text-black mb-1">Thank you for shopping with JD Store!</p>
              <p>For support or queries, contact us via WhatsApp.</p>
              <p className="mt-4 text-xs text-gray-400">Generated on {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

      <div className="page-container py-24 text-center max-w-lg mx-auto print:hidden">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)' }}>
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Order Placed!</h1>
          <p className="text-white/40 text-sm mb-6">Order #{orderNumber}</p>
          
          {paymentMethod === 'whatsapp' ? (
            <>
              <div className="glass-card p-5 mb-8 text-left border-green-500/30 bg-green-500/5">
                <p className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Next Steps
                </p>
                <p className="text-white/80 text-sm mb-3">
                  Your order is currently pending. Please message us on WhatsApp to confirm the order and arrange payment.
                </p>
              </div>

              <a href={successWhatsappUrl} rel="noopener noreferrer" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center gap-2 mb-4 py-4 text-base font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-colors">
                <MessageCircle className="w-5 h-5" />
                Message on WhatsApp
              </a>
            </>
          ) : utrSubmitted ? (
            <div className="glass-card p-8 mb-8 border-green-500/30 bg-green-500/5">
              <h3 className="text-green-400 font-bold text-xl mb-2">Payment Submitted! 🎉</h3>
              <p className="text-white/80 text-sm">
                Thank you! We are verifying your UTR: <strong>{utrNumber}</strong>. Your order will be processed shortly. Redirecting you to orders...
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl border border-white/20 inline-block w-full max-w-xs relative group">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 shadow-lg scale-95 group-hover:scale-100">
                  ✨ Tap QR code to pay! (Amount auto-fills)
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
                
                <a href={upiString} className="relative aspect-square w-full mb-4 block cursor-pointer hover:scale-105 transition-transform">
                  <Image 
                    src={qrUrl}
                    alt="Dynamic UPI QR Code" 
                    fill
                    className="rounded-lg object-contain"
                    unoptimized
                  />
                </a>
                <p className="text-black font-bold mt-2 text-lg">Scan to pay: {formatCurrency(placedOrderTotal)}</p>
                <p className="text-black/60 text-xs mt-1 font-mono">UPI: {upiId}</p>
                
                <a 
                  href={upiString}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors sm:hidden leading-tight"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>Tap to Pay with UPI App</span>
                  </div>
                  <span className="text-white/70 text-[10px] font-normal tracking-wide">(Amount auto-fills)</span>
                </a>
              </div>

              <div className="glass-card p-5 mb-8 text-left">
                <p className="text-white font-semibold mb-3">Confirm Payment</p>
                <p className="text-white/60 text-xs mb-4">After paying {formatCurrency(placedOrderTotal)}, please enter your 12-digit UTR (Reference ID) below.</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={12}
                    placeholder="Enter 12-digit UTR..." 
                    className="input-luxe flex-1"
                  />
                  <button 
                    onClick={submitUTR}
                    disabled={utrSubmitting || utrNumber.length < 12}
                    className="btn-gold px-6 whitespace-nowrap disabled:opacity-50"
                  >
                    {utrSubmitting ? 'Verifying...' : 'Submit UTR'}
                  </button>
                </div>
              </div>
            </>
          )}
          
          <button onClick={() => window.print()} className="btn-luxe flex w-full items-center justify-center gap-2 mb-8 py-3 text-sm">
            Download PDF Receipt
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link prefetch={true} href="/dashboard/orders" className="btn-secondary flex-1 text-center text-sm">View My Orders</Link>
            <Link prefetch={true} href="/" className="btn-luxe-outline flex-1 text-center text-sm">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
      </>
    );
  }

  return (
    <div className="page-container py-10 md:py-16 relative">
      {/* Delete Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 max-w-sm w-full relative z-10"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-lg text-center mb-2">Delete Address?</h3>
            <p className="text-white/60 text-sm text-center mb-6">
              Are you sure you want to delete this saved address? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setAddressToDelete(null)}
                className="btn-luxe-outline flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => handleDeleteAddress(addressToDelete)}
                className="flex-1 py-2.5 text-sm rounded-xl font-semibold bg-red-500/80 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <Link prefetch={true} href="/cart" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Checkout</h1>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between relative max-w-sm mx-auto mb-10">
          <div className="absolute left-0 top-3 -translate-y-1/2 w-full h-[2px] bg-white/10 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-3 -translate-y-1/2 w-[35%] h-[2px] bg-luxe-accent -z-10 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(200,169,110,0.5)]"></div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-luxe-accent text-black flex items-center justify-center text-[10px] font-bold shadow-[0_0_15px_rgba(200,169,110,0.4)] relative">
              1
              <div className="absolute inset-0 rounded-full border border-luxe-accent animate-ping opacity-20"></div>
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-luxe-accent font-semibold text-center w-16">Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black border border-luxe-accent text-luxe-accent flex items-center justify-center text-[10px] font-bold">2</div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/70 font-medium text-center w-16">Review</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black border border-white/20 text-white/30 flex items-center justify-center text-[10px] font-bold">3</div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30 text-center w-16">Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          
          {/* Saved Addresses */}
          {savedAddresses.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-luxe-accent" />
                  <h2 className="text-white font-semibold text-sm">Select Delivery Address</h2>
                </div>
                {!showForm && (
                  <button type="button" onClick={() => setShowForm(true)} className="text-luxe-accent text-sm hover:underline">
                    + Add New Address
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div 
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={cn(
                      'p-4 rounded-xl border cursor-pointer transition-all relative group',
                      !showForm && selectedAddressId === addr.id 
                        ? 'bg-luxe-accent/10 border-luxe-accent' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    )}
                  >
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddressToDelete(addr.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-white font-medium text-sm mb-1 pr-8">{addr.full_name}</p>
                    <p className="text-white/60 text-xs mb-2">{addr.phone}</p>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-2">
                      {[addr.house_no, addr.street, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn("space-y-6", !showForm ? "hidden" : "block")}>
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
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                  Pincode * {isFetchingPincode && <span className="text-luxe-accent lowercase">(auto-filling...)</span>}
                </label>
                <input {...register('pincode')} className="input-luxe" placeholder="6-digit pincode" maxLength={6} />
                {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode.message}</p>}
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">District *</label>
                <select {...register('district')} className="input-luxe">
                  <option value="">Select District</option>
                  {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Nearby Landmark</label>
                <input {...register('landmark')} className="input-luxe" placeholder="e.g. Near SBI Bank" />
              </div>
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

          {/* Payment Method */}
          <div className="glass-card p-6 border border-luxe-accent/20 bg-luxe-dark">
            <h2 className="text-white font-semibold text-base mb-5">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => setPaymentMethod('upi')} 
                className={cn('p-4 rounded-xl border flex flex-col items-start gap-2 text-left transition-all', paymentMethod === 'upi' ? 'border-luxe-accent bg-luxe-accent/10' : 'border-white/10 hover:border-white/30')}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="text-white font-medium text-sm">Direct UPI (QR Code)</span>
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border", paymentMethod === 'upi' ? "bg-luxe-accent border-luxe-accent" : "border-white/30")}>
                    {paymentMethod === 'upi' && <Check className="w-3 h-3 text-black" />}
                  </div>
                </div>
                <span className="text-white/50 text-xs mt-1">Fast & Secure. Scan QR and pay directly via GPay, PhonePe, Paytm, etc.</span>
              </button>
              
              <button 
                type="button" 
                onClick={() => setPaymentMethod('whatsapp')} 
                className={cn('p-4 rounded-xl border flex flex-col items-start gap-2 text-left transition-all', paymentMethod === 'whatsapp' ? 'border-[#25D366] bg-[#25D366]/10' : 'border-white/10 hover:border-white/30')}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="text-white font-medium text-sm">Order via WhatsApp</span>
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border", paymentMethod === 'whatsapp' ? "bg-[#25D366] border-[#25D366]" : "border-white/30")}>
                    {paymentMethod === 'whatsapp' && <Check className="w-3 h-3 text-black" />}
                  </div>
                </div>
                <span className="text-white/50 text-xs mt-1">Chat with our team to arrange manual payment and confirmation.</span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center gap-3 py-4 text-base font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-colors">
            {submitting
              ? <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              : <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
            }
            {submitting ? 'Processing...' : paymentMethod === 'upi' ? 'Place Order & Pay' : 'Place Order via WhatsApp'}
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
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Discount ({appliedCoupon.code})
                  </span>
                  <span className="text-green-400">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-white">Total</span>
                <span className="text-white text-lg">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
            
            {/* Coupon Input */}
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
                      className="px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-400 text-xs mb-3">{couponError}</p>}
                  
                  {availableCoupons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Available Coupons</p>
                      {availableCoupons.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setCouponCode(c.code); applyCoupon(c.code); }}
                          className="w-full text-left p-2.5 rounded-xl border border-white/10 hover:border-luxe-accent/50 hover:bg-white/5 transition-all flex justify-between items-center group"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-luxe-accent group-hover:scale-110 transition-transform" />
                            <div>
                              <span className="text-white text-sm font-mono block">{c.code}</span>
                              <span className="text-white/40 text-[10px] block">
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
                  <button type="button" onClick={removeCoupon} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 p-3 rounded-xl space-y-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#4ade80' }}>
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Secure SSL checkout</span>
              </div>
              <div className="text-[10px] text-green-400/70 pl-5 leading-tight">
                * We do not accept Cash on Delivery (COD). All orders require online payment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
