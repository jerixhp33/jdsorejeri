'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, Check, ArrowRight, Smartphone, Lock, Truck, CreditCard, Sparkles } from 'lucide-react';
import { processExpressOrder, ExpressOrderItem, ExpressShippingAddress } from '@/app/actions/expressCheckout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ExpressCheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExpressOrderItem;
}

export function ExpressCheckOutModal({ isOpen, onClose, item }: ExpressCheckOutModalProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<'details' | 'pin_auth' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'gpay' | 'phonepe' | 'paytm' | 'cred' | 'upi_id' | 'cod'>('gpay');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [orderResult, setOrderResult] = useState<{ trackingNumber: string; estimatedDelivery: string } | null>(null);

  const [address, setAddress] = useState<ExpressShippingAddress>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (profile) {
      setAddress({
        name: profile.name || '',
        phone: (profile as any).phone || '',
        address: (profile as any).address || '',
        city: (profile as any).city || '',
        state: (profile as any).state || '',
        pincode: (profile as any).pincode || '',
      });
    }
  }, [profile]);

  if (!isOpen) return null;

  const totalAmount = item.price * item.quantity;

  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.address || !address.pincode) {
      toast.error('Please fill in your delivery details');
      return;
    }

    if (selectedMethod === 'upi_id' && !upiIdInput.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g. name@okaxis)');
      return;
    }

    if (selectedMethod === 'cod') {
      executeOrderSubmit('cod');
    } else {
      // Launch native UPI PIN Authorization simulation
      setStep('pin_auth');
    }
  };

  const handlePinSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      executeOrderSubmit(selectedMethod);
    }, 1200);
  };

  const executeOrderSubmit = async (method: 'gpay' | 'phonepe' | 'paytm' | 'cred' | 'upi_id' | 'cod') => {
    setLoading(true);
    const res = await processExpressOrder({
      items: [item],
      shippingAddress: address,
      paymentMethod: method,
      upiId: selectedMethod === 'upi_id' ? upiIdInput : undefined,
      totalAmount,
    });

    if (res.success) {
      setOrderResult({
        trackingNumber: res.trackingNumber,
        estimatedDelivery: res.estimatedDelivery,
      });
      setStep('success');
      toast.success('Order placed via 1-Click Express UPI!');
    } else {
      toast.error('Order failed. Please try again.');
      setStep('details');
    }
    setLoading(false);
  };

  const getMethodName = () => {
    switch (selectedMethod) {
      case 'gpay': return 'Google Pay';
      case 'phonepe': return 'PhonePe';
      case 'paytm': return 'Paytm';
      case 'cred': return 'CRED UPI';
      case 'upi_id': return 'UPI ID';
      default: return 'Cash on Delivery';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#121212] border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#161616]">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-luxe-accent/20 border border-luxe-accent/40 flex items-center justify-center text-luxe-accent">
                <Zap size={15} className="animate-pulse" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  1-Click Express Checkout
                </h3>
                <p className="text-white/40 text-[10px] sm:text-xs">Instant UPI Payment & Fast Shipping</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content depending on step */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {step === 'details' && (
              <form id="express-form" onSubmit={handlePayClick} className="space-y-5">
                {/* Product Preview Card */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-white/50 mt-1">
                      {item.size && <span>Size: <strong className="text-white/80">{item.size}</strong></span>}
                      <span>Qty: <strong className="text-white/80">{item.quantity}</strong></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-luxe-accent font-extrabold text-base">₹{totalAmount.toLocaleString()}</p>
                    <span className="text-[10px] text-green-400 font-medium flex items-center justify-end gap-1">
                      <Truck size={10} /> FREE Delivery
                    </span>
                  </div>
                </div>

                {/* Delivery Info Fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">1. Delivery Info</h4>
                    <span className="text-[10px] text-white/40">Pre-filled from profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={address.name}
                      onChange={e => setAddress({ ...address, name: e.target.value })}
                      required
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-luxe-accent outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Phone (10 digits) *"
                      value={address.phone}
                      onChange={e => setAddress({ ...address, phone: e.target.value })}
                      required
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-luxe-accent outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Street Address / House No. *"
                    value={address.address}
                    onChange={e => setAddress({ ...address, address: e.target.value })}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-luxe-accent outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City *"
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      required
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-luxe-accent outline-none"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      required
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-luxe-accent outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={address.pincode}
                      onChange={e => setAddress({ ...address, pincode: e.target.value })}
                      required
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-luxe-accent outline-none"
                    />
                  </div>
                </div>

                {/* Instant UPI App Selector */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">2. Select Payment Method</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Google Pay */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('gpay')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        selectedMethod === 'gpay'
                          ? 'border-luxe-accent bg-luxe-accent/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-blue-400 text-sm font-black tracking-tight">G Pay</span>
                      <span className="text-[10px] text-white/40">Google Pay</span>
                    </button>

                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('phonepe')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        selectedMethod === 'phonepe'
                          ? 'border-luxe-accent bg-luxe-accent/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-purple-400 text-sm font-black">पे PhonePe</span>
                      <span className="text-[10px] text-white/40">Instant UPI</span>
                    </button>

                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('paytm')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        selectedMethod === 'paytm'
                          ? 'border-luxe-accent bg-luxe-accent/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sky-400 text-sm font-black">Paytm</span>
                      <span className="text-[10px] text-white/40">UPI Wallet</span>
                    </button>

                    {/* CRED */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('cred')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        selectedMethod === 'cred'
                          ? 'border-luxe-accent bg-luxe-accent/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-white text-sm font-black tracking-widest">CRED</span>
                      <span className="text-[10px] text-white/40">CRED UPI</span>
                    </button>

                    {/* Any UPI ID */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('upi_id')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        selectedMethod === 'upi_id'
                          ? 'border-luxe-accent bg-luxe-accent/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <Smartphone size={16} className="text-luxe-accent" />
                      <span className="text-[10px] text-white/60">UPI ID</span>
                    </button>

                    {/* COD */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('cod')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        selectedMethod === 'cod'
                          ? 'border-luxe-accent bg-luxe-accent/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <CreditCard size={16} className="text-yellow-400" />
                      <span className="text-[10px] text-white/60">Cash on Delivery</span>
                    </button>
                  </div>

                  {selectedMethod === 'upi_id' && (
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g. mobile@upi)"
                      value={upiIdInput}
                      onChange={e => setUpiIdInput(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:border-luxe-accent outline-none mt-2"
                    />
                  )}
                </div>

                {/* Submit Action Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-luxe-accent text-black font-extrabold text-sm hover:bg-luxe-accent/90 transition shadow-xl flex items-center justify-center gap-2 group"
                  >
                    <span>Pay ₹{totalAmount.toLocaleString()} via {getMethodName()}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="text-[10px] text-center text-white/40 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-green-400" /> 256-bit Encrypted SSL Payment Guarantee
                  </p>
                </div>
              </form>
            )}

            {/* Simulated UPI PIN Authorization overlay */}
            {step === 'pin_auth' && (
              <div className="py-6 text-center space-y-6">
                <div className="w-14 h-14 rounded-full bg-luxe-accent/20 border border-luxe-accent/40 flex items-center justify-center text-luxe-accent mx-auto animate-bounce">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Authorizing {getMethodName()}</h4>
                  <p className="text-xs text-white/50 mt-1">Enter your 4-digit UPI PIN to confirm ₹{totalAmount.toLocaleString()}</p>
                </div>

                {/* Simulated PIN Dots Input */}
                <div className="flex justify-center gap-3 my-4">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      type="password"
                      maxLength={1}
                      value={pinDigits[i]}
                      onChange={(e) => {
                        const newPin = [...pinDigits];
                        newPin[i] = e.target.value;
                        setPinDigits(newPin);
                        if (e.target.value && i < 3) {
                          const nextInput = document.getElementById(`pin-${i + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      id={`pin-${i}`}
                      className="w-12 h-12 text-center text-xl font-bold bg-black/60 border border-white/20 rounded-xl text-white focus:border-luxe-accent outline-none"
                    />
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePinSubmit}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-luxe-accent text-black text-xs font-extrabold hover:bg-luxe-accent/90 transition shadow-lg flex items-center gap-2"
                  >
                    {loading ? 'Confirming...' : 'Authorize Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Success Screen */}
            {step === 'success' && orderResult && (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 mx-auto">
                  <Check size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Order Confirmed!</h4>
                  <p className="text-xs text-white/60 mt-1">
                    Tracking No: <strong className="text-luxe-accent">{orderResult.trackingNumber}</strong>
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    Estimated Delivery: {orderResult.estimatedDelivery}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/50">Item:</span>
                    <span className="text-white font-medium">{item.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Amount Paid:</span>
                    <span className="text-luxe-accent font-bold">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Payment Method:</span>
                    <span className="text-white capitalize">{getMethodName()}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    href={`/track/${orderResult.trackingNumber}`}
                    onClick={onClose}
                    className="px-6 py-3 rounded-2xl bg-luxe-accent text-black font-extrabold text-xs hover:bg-luxe-accent/90 transition shadow-xl inline-flex items-center gap-1.5"
                  >
                    Track Order Status <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
