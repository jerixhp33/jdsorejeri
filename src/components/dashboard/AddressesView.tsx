'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { DeliveryAddress } from '@/types';

interface AddressesViewProps {
  addresses: DeliveryAddress[];
  userProfileId: string;
}

export function AddressesView({ addresses: initial, userProfileId }: AddressesViewProps) {
  const [addresses, setAddresses] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    setDeletingId(id);
    const res = await fetch('/api/addresses', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) }); const error = res.ok ? null : true;
    if (!error) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Saved Addresses</h1>
      </div>

      {addresses.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <MapPin className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-2">No saved addresses</p>
          <p className="text-white/30 text-sm">
            Addresses are saved automatically when you place orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address, i) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-luxe-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-luxe-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{address.full_name}</p>
                      {address.is_default && (
                        <span className="badge-gold text-[10px]">Default</span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">
                      {address.house_no}, {address.street}, {address.area}
                    </p>
                    <p className="text-white/60 text-sm">
                      {address.city}, {address.district} — {address.pincode}
                    </p>
                    {address.landmark && (
                      <p className="text-white/40 text-xs mt-1">Near: {address.landmark}</p>
                    )}
                    <p className="text-white/50 text-sm mt-1">📞 {address.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!address.is_default && (
                    <button
                      onClick={() => setDefault(address.id)}
                      className="p-2 rounded-lg text-white/40 hover:text-luxe-accent hover:bg-luxe-accent/10 transition-all"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAddress(address.id)}
                    disabled={deletingId === address.id}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
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
    </div>
  );
}
