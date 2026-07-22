'use client';

import { useState } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type Coupon = any; // We'll just use any for brevity

interface AdminCouponsViewProps {
  coupons: Coupon[];
}

const emptyForm = () => ({
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  usage_limit: '',
  is_active: true,
});

export function AdminCouponsView({ coupons: initial }: AdminCouponsViewProps) {
  const [coupons, setCoupons] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  useScrollLock(showModal);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();

  const openCreate = () => {
    setEditCoupon(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value.toString(),
      min_order_amount: c.min_order_amount.toString(),
      usage_limit: c.usage_limit ? c.usage_limit.toString() : '',
      is_active: c.is_active,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.code || !form.discount_value) {
      toast.error('Code and value are required');
      return;
    }
    setSaving(true);
    
    const payload = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      is_active: form.is_active,
    };

    try {
      if (editCoupon) {
        const { data, error } = await supabase.from('coupons').update(payload).eq('id', editCoupon.id).select().single();
        if (error) throw error;
        setCoupons(prev => prev.map(c => c.id === editCoupon.id ? data : c));
        toast.success('Coupon updated');
      } else {
        const { data, error } = await supabase.from('coupons').insert(payload).select().single();
        if (error) throw error;
        setCoupons(prev => [data, ...prev]);
        toast.success('Coupon created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        toast.error('Cannot delete a coupon that has been used in orders. Please deactivate it instead.');
      } else {
        toast.error(`Failed to delete coupon: ${error.message}`);
      }
    } else {
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Coupons</h1>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {coupons.map((coupon, i) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn('glass-card p-5 relative', !coupon.is_active && 'opacity-60')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="w-4 h-4 text-luxe-accent" />
              <h3 className="text-white font-mono font-bold text-lg tracking-wider">{coupon.code}</h3>
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-white/80 text-sm">
                Discount: <span className="font-semibold text-white">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                </span>
              </p>
              <p className="text-white/50 text-xs">Min Order: ₹{coupon.min_order_amount}</p>
              <p className="text-white/50 text-xs">
                Uses: {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : '(unlimited)'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(coupon)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs transition-all"
              >
                <Edit2 className="w-3 h-3" />Edit
              </button>
              <button onClick={() => deleteCoupon(coupon.id)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {!coupon.is_active && (
              <span className="absolute top-4 right-4 badge-luxe !bg-red-500/20 !text-red-400 !border-red-500/30 text-[10px]">Inactive</span>
            )}
          </motion.div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full glass-card p-16 text-center text-white/30">
            No coupons found. Create one to start offering discounts!
          </div>
        )}
      </div>

      {showModal && (
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md glass-card p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">{editCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Coupon Code *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="input-luxe font-mono uppercase"
                  placeholder="e.g. WELCOME10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Type *</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
                    className="input-luxe capitalize"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Value *</label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    className="input-luxe"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Min Order (₹)</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                    className="input-luxe"
                    placeholder="e.g. 999"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usage_limit}
                    onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                    className="input-luxe"
                    placeholder="e.g. 100 (blank for unlmtd)"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-luxe-accent"
                />
                <label htmlFor="couponActive" className="text-white/60 text-sm cursor-pointer">
                  Active (can be used)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-luxe-outline flex-1 text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-gold flex-1 text-sm">
                {saving ? 'Saving...' : editCoupon ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
