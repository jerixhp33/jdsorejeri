'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Star, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DeliveryAddress } from '@/types';

interface AddressesViewProps {
  addresses: DeliveryAddress[];
  userProfileId: string;
}

export function AddressesView({ addresses: initial, userProfileId }: AddressesViewProps) {
  const [addresses, setAddresses] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DeliveryAddress>>({});
  const [isSaving, setIsSaving] = useState(false);

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    setDeletingId(id);
    const res = await fetch('/api/addresses', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } else {
      toast.error('Failed to delete address');
    }
    setDeletingId(null);
  };

  const setDefault = async (id: string) => {
    const res = await fetch('/api/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, user_id: userProfileId, set_default: true }),
    });
    if (!res.ok) {
      toast.error('Failed to update default address');
      return;
    }
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );
    toast.success('Default address updated');
  };

  const openModal = (address?: DeliveryAddress) => {
    if (address) {
      setEditingId(address.id);
      setFormData(address);
    } else {
      setEditingId(null);
      setFormData({
        full_name: '',
        phone: '',
        house_no: '',
        street: '',
        area: '',
        city: '',
        district: '',
        pincode: '',
        landmark: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        // Edit existing
        const res = await fetch('/api/addresses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: editingId, user_id: userProfileId }),
        });
        if (!res.ok) throw new Error('Failed to update address');
        const updated = await res.json();
        setAddresses((prev) => prev.map(a => a.id === editingId ? { ...a, ...formData } as DeliveryAddress : a));
        toast.success('Address updated');
      } else {
        // Add new
        const payload = {
          ...formData,
          user_id: userProfileId,
          is_default: addresses.length === 0 // Make default if it's the first one
        };
        const res = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to add address');
        const inserted = await res.json();
        if (inserted.data) {
          setAddresses((prev) => [...prev, inserted.data[0]]);
        }
        toast.success('Address added');
      }
      closeModal();
    } catch (err) {
      toast.error('An error occurred while saving the address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Saved Addresses</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-luxe-accent hover:bg-[#b5952f] text-black text-sm font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="glass-card p-8 sm:p-16 text-center">
          <MapPin className="w-10 h-10 text-foreground/ mx-auto mb-4" />
          <p className="text-foreground/ mb-2">No saved addresses</p>
          <p className="text-foreground/ text-sm mb-6">
            Add a delivery address to make checkout faster.
          </p>
          <button onClick={() => openModal()} className="btn-luxe-outline text-sm">Add Address</button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address, i) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 sm:p-5 relative"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-luxe-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-luxe-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-foreground font-medium">{address.full_name}</p>
                      {address.is_default && (
                        <span className="badge-gold text-[10px]">Default</span>
                      )}
                    </div>
                    <p className="text-foreground/ text-sm">
                      {address.house_no}, {address.street}, {address.area}
                    </p>
                    <p className="text-foreground/ text-sm">
                      {address.city}, {address.district} — {address.pincode}
                    </p>
                    {address.landmark && (
                      <p className="text-foreground/ text-xs mt-1">Near: {address.landmark}</p>
                    )}
                    <p className="text-foreground/ text-sm mt-1">📞 {address.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end sm:justify-start border-t border-foreground/ sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                  <button
                    onClick={() => openModal(address)}
                    className="p-2 rounded-lg text-foreground/ hover:text-foreground hover:bg-foreground/ transition-all"
                    title="Edit address"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!address.is_default && (
                    <button
                      onClick={() => setDefault(address.id)}
                      className="p-2 rounded-lg text-foreground/ hover:text-luxe-accent hover:bg-luxe-accent/10 transition-all"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAddress(address.id)}
                    disabled={deletingId === address.id}
                    className="p-2 rounded-lg text-foreground/ hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-foreground/ rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 sm:p-6 border-b border-foreground/ flex justify-between items-center bg-black/40">
                <h2 className="text-xl font-bold text-foreground font-display">
                  {editingId ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button onClick={closeModal} className="text-foreground/ hover:text-foreground p-1 rounded-full hover:bg-foreground/ transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                <form id="address-form" onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">Full Name</label>
                      <input required type="text" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} className="input-luxe w-full" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">Phone Number</label>
                      <input required type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-luxe w-full" placeholder="10-digit number" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">House / Flat No.</label>
                      <input required type="text" value={formData.house_no || ''} onChange={e => setFormData({...formData, house_no: e.target.value})} className="input-luxe w-full" placeholder="e.g. 42A" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">Street / Area</label>
                      <input required type="text" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} className="input-luxe w-full" placeholder="Main Street" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">Area / Locality</label>
                    <input required type="text" value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value})} className="input-luxe w-full" placeholder="Gandhipuram" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">City</label>
                      <input required type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="input-luxe w-full" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">Pincode</label>
                      <input required type="text" value={formData.pincode || ''} onChange={e => setFormData({...formData, pincode: e.target.value})} className="input-luxe w-full" placeholder="641001" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-foreground/ mb-1.5">Landmark (Optional)</label>
                    <input type="text" value={formData.landmark || ''} onChange={e => setFormData({...formData, landmark: e.target.value})} className="input-luxe w-full" placeholder="Near post office" />
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-foreground/ bg-black/40 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="btn-glass px-6">Cancel</button>
                <button form="address-form" type="submit" disabled={isSaving} className="btn-gold px-8">
                  {isSaving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
