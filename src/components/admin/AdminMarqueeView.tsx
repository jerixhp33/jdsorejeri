'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface MarqueeLabel {
  id: string;
  text: string;
  is_active: boolean;
  order_index: number;
  created_at?: string;
}

interface AdminMarqueeViewProps {
  labels: MarqueeLabel[];
}

const EMPTY: Omit<MarqueeLabel, 'id' | 'created_at'> = {
  text: '',
  is_active: true,
  order_index: 0,
};

export function AdminMarqueeView({ labels: initial }: AdminMarqueeViewProps) {
  const [items, setItems] = useState<MarqueeLabel[]>(initial);
  const [modal, setModal] = useState<{ open: boolean; data: Partial<MarqueeLabel> & { id?: string } }>({
    open: false,
    data: { ...EMPTY },
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () =>
    setModal({ open: true, data: { ...EMPTY, order_index: items.length + 1 } });

  const openEdit = (l: MarqueeLabel) =>
    setModal({ open: true, data: { ...l } });

  const closeModal = () =>
    setModal({ open: false, data: { ...EMPTY } });

  const handleSave = async () => {
    const { id, ...body } = modal.data;
    if (!body.text?.trim()) { toast.error('Text is required'); return; }

    setSaving(true);
    try {
      if (id) {
        const res = await fetch('/api/admin/marquee', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...body }),
        });
        if (!res.ok) throw new Error();
        const updated: MarqueeLabel = await res.json();
        setItems((prev) => prev.map((l) => (l.id === id ? updated : l)));
        toast.success('Label updated');
      } else {
        const res = await fetch('/api/admin/marquee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const created: MarqueeLabel = await res.json();
        setItems((prev) => [...prev, created]);
        toast.success('Label added');
      }
      closeModal();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this label?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/marquee', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((l) => l.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (l: MarqueeLabel) => {
    try {
      const res = await fetch('/api/admin/marquee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id, is_active: !l.is_active }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) =>
        prev.map((item) => (item.id === l.id ? { ...item, is_active: !l.is_active } : item))
      );
      toast.success(l.is_active ? 'Deactivated' : 'Activated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Marquee Labels</h1>
          <p className="text-white/50 text-sm mt-1">Manage the rotating text in the hero section</p>
        </div>
        <button onClick={openCreate} className="btn-luxe flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Label
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="py-4 px-6 text-white/50 font-medium text-sm">Text</th>
                <th className="py-4 px-6 text-white/50 font-medium text-sm">Order</th>
                <th className="py-4 px-6 text-white/50 font-medium text-sm">Status</th>
                <th className="py-4 px-6 text-right text-white/50 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <p className="text-white font-medium">{item.text}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white/70 text-sm">{item.order_index}</span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleActive(item)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
                      )}
                    >
                      {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {item.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-white/40">
                    No marquee labels found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-white">
                    {modal.data.id ? 'Edit Label' : 'Add Label'}
                  </h2>
                  <button onClick={closeModal} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Text *</label>
                    <input
                      value={modal.data.text}
                      onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, text: e.target.value } }))}
                      className="input-luxe w-full"
                      placeholder="e.g. Premium Quality"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Order Index</label>
                    <input
                      type="number"
                      value={modal.data.order_index}
                      onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, order_index: parseInt(e.target.value) || 0 } }))}
                      className="input-luxe w-full"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      checked={modal.data.is_active}
                      onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, is_active: e.target.checked } }))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-luxe-accent focus:ring-luxe-accent focus:ring-offset-0"
                    />
                    <label className="text-white/70 text-sm">Active (visible on landing page)</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                  <button onClick={closeModal} className="btn-luxe-outline">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-luxe flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Label'}
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
