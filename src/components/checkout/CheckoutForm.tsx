'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MessageCircle, MapPin, User, ArrowLeft, Check, Trash2, Tag, X } from 'lucide-react';
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
  
  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const { appliedCoupon, setAppliedCoupon } = useCouponStore();
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  // Track the total for the success screen
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0);
  
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
  }, [profile?.id, supabase]);

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

  const handleSelectSavedAddress = (addr: DeliveryAddress) => {
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
  };

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
        whatsapp_sent: true,
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

      setOrderNumber(ordNum);
      setPlacedOrderTotal(finalTotal);
      setOrderPlaced(true);

      const cleanPhone = WHATSAPP_NUMBER.replace(/\D/g, '');
      const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      const shortMsg = encodeURIComponent(`Here is my payment screenshot for Order #${ordNum}`);
      const waUrl = `https://wa.me/${waNumber}?text=${shortMsg}`;
      setSuccessWhatsappUrl(waUrl);
      
      // Attempt to auto-open (might be blocked by Safari/Chrome popup blockers)
      setTimeout(() => window.open(waUrl, '_blank'), 100);
      
      // Clear cart last to prevent race conditions with component unmounting
      await clearCart();
    } catch (err: unknown) {
      console.error('Order error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced && !submitting) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-white/50 mb-6">Your cart is empty</p>
        <Link prefetch={true} href="/" className="btn-glass !w-auto !px-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    );
  }

  if (orderPlaced) {
    const upiId = 'manikandanjanani67@oksbi';
    const upiName = 'JD Store';
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${placedOrderTotal}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

    return (
      <div className="page-container py-24 text-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)' }}>
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Order Placed!</h1>
          <p className="text-white/40 text-sm mb-6">Order #{orderNumber}</p>
          
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl border border-white/20 inline-block w-full max-w-xs relative group cursor-help">
            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 shadow-lg scale-95 group-hover:scale-100">
              ✨ Amount auto-fills in your UPI app!
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
            
            <div className="relative aspect-square w-full mb-4">
              <Image 
                src={qrUrl}
                alt="Dynamic UPI QR Code" 
                fill
                className="rounded-lg object-contain"
                unoptimized
              />
            </div>
            <p className="text-black font-bold mt-2 text-lg">Scan to pay: {formatCurrency(placedOrderTotal)}</p>
            <p className="text-black/60 text-xs mt-1 font-mono">UPI: {upiId}</p>
            
            {/* Mobile tap to pay button */}
            <a 
              href={upiString}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors sm:hidden leading-tight"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                <span>Tap to Pay with UPI App</span>
              </div>
              <span className="text-white/70 text-[10px] font-normal tracking-wide">(Amount auto-fills)</span>
            </a>
          </div>

          <div className="glass-card p-5 mb-8 text-left border-green-500/30 bg-green-500/5">
            <p className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" /> Payment Instructions
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-white/80">
              <li className="hidden sm:list-item">Scan the QR code above with any UPI app (GPay, PhonePe, Paytm).</li>
              <li className="sm:hidden">Tap the blue button above to open your UPI app.</li>
              <li>Pay the exact total amount: <strong>{formatCurrency(placedOrderTotal)}</strong>.</li>
              <li>Take a <strong>screenshot</strong> of your successful payment.</li>
              <li>Click the WhatsApp button below to send your order details, and <strong>attach your payment screenshot</strong>.</li>
              <li>JD Store will verify your payment and update your order status in the app!</li>
            </ol>
          </div>

          <a href={successWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold w-full flex items-center justify-center gap-2 mb-8 py-4 text-base font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40">
            <MessageCircle className="w-6 h-6" />
            Send Order & Payment Screenshot
          </a>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link prefetch={true} href="/dashboard/orders" className="btn-gold flex-1 text-center text-sm">View My Orders</Link>
            <Link prefetch={true} href="/" className="btn-luxe-outline flex-1 text-center text-sm">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
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

      <div className="flex items-center gap-3 mb-8">
        <Link prefetch={true} href="/cart" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">Delivery Details</h1>
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
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Confirm order via WhatsApp — No upfront payment</span>
              </div>
              <div className="text-[10px] text-green-400/70 pl-5 leading-tight">
                * We do not accept Cash on Delivery (COD). After you send the WhatsApp message, our team will provide a UPI scanner or number to complete your payment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
