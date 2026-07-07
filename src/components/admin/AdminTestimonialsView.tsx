'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, ChevronUp, ChevronDown, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/types';

interface AdminTestimonialsViewProps {
  testimonials: Testimonial[];
}

const EMPTY: Omit<Testimonial, 'id' | 'created_at'> = {
  author_name: '',
  author_image: '',
  author_location: '',
  body: '',
  rating: 5,
  is_active: true,
  display_order: 0,
};

export function AdminTestimonialsView({ testimonials: initial }: AdminTestimonialsViewProps) {
  const [items, setItems] = useState<Testimonial[]>(initial);
  const [modal, setModal] = useState<{ open: boolean; data: Partial<Testimonial> & { id?: string } }>({
    open: false,
    data: { ...EMPTY },
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () =>
    setModal({ open: true, data: { ...EMPTY, display_order: items.length } });

  const openEdit = (t: Testimonial) =>
    setModal({ open: true, data: { ...t } });

  const closeModal = () =>
    setModal({ open: false, data: { ...EMPTY } });

  const handleSave = async () => {
    const { id, ...body } = modal.data;
    if (!body.author_name?.trim()) { toast.error('Author name is required'); return; }
    if (!body.body?.trim()) { toast.error('Review text is required'); return; }

    setSaving(true);
    try {
      if (id) {
        // Edit
        const res = await fetch('/api/admin/testimonials', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...body }),
        });
        if (!res.ok) throw new Error();
        const updated: Testimonial = await res.json();
        setItems((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast.success('Testimonial updated');
      } else {
        // Create
        const res = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const created: Testimonial = await res.json();
        setItems((prev) => [...prev, created]);
        toast.success('Testimonial added');
      }
      closeModal();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((t) => t.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (t: Testimonial) => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, is_active: !item.is_active } : item))
        );
        toast.success(t.is_active ? 'Testimonial hidden' : 'Testimonial visible');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to toggle status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error toggling status');
    }
  };

  const moveOrder = async (t: Testimonial, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === t.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];

    // Swap display_order values
    await Promise.all([
      fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, display_order: other.display_order }),
      }),
      fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: other.id, display_order: t.display_order }),
      }),
    ]);

    const newItems = [...items];
    newItems[idx] = { ...t, display_order: other.display_order };
    newItems[swapIdx] = { ...other, display_order: t.display_order };
    newItems.sort((a, b) => a.display_order - b.display_order);
    setItems(newItems);
  };

  const set = (key: keyof typeof EMPTY, val: unknown) =>
    setModal((prev) => ({ ...prev, data: { ...prev.data, [key]: val } }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Testimonials</h1>
          <p className="text-white/40 text-sm mt-1">{items.length} total · {items.filter((t) => t.is_active).length} active</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-luxe-accent text-black font-semibold text-sm hover:bg-luxe-accent/90 transition-all">
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Star className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No testimonials yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t, idx) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('glass-card p-5 flex items-start gap-4', !t.is_active && 'opacity-50')}
            >
              {/* Order controls */}
              <div className="flex flex-col gap-1 pt-0.5">
                <button
                  onClick={() => moveOrder(t, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <span className="text-white/20 text-[10px] text-center">{t.display_order}</span>
                <button
                  onClick={() => moveOrder(t, 1)}
                  disabled={idx === items.length - 1}
                  className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-white font-medium text-sm">{t.author_name}</p>
                  {t.author_location && (
                    <span className="text-white/30 text-xs">· {t.author_location}</span>
                  )}
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 ml-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3 h-3',
                          i < t.rating ? 'text-luxe-accent fill-current' : 'text-white/20'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-white/50 text-sm line-clamp-2">{t.body}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleActive(t)}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    t.is_active
                      ? 'text-green-400 hover:bg-green-500/10'
                      : 'text-white/30 hover:bg-white/5'
                  )}
                  title={t.is_active ? 'Hide' : 'Show'}
                >
                  {t.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
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
              className="glass-card w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-semibold text-lg">
                  {modal.data.id ? 'Edit Testimonial' : 'Add Testimonial'}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Author name */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Author Name *</label>
                <input
                  value={modal.data.author_name || ''}
                  onChange={(e) => set('author_name', e.target.value)}
                  className="input-luxe w-full"
                  placeholder="e.g. Priya S."
                />
              </div>

              {/* Author location */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Location</label>
                <input
                  value={modal.data.author_location || ''}
                  onChange={(e) => set('author_location', e.target.value)}
                  className="input-luxe w-full"
                  placeholder="e.g. Chennai, Tamil Nadu"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => set('rating', r)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6 transition-colors',
                          r <= (modal.data.rating ?? 5)
                            ? 'text-luxe-accent fill-current'
                            : 'text-white/20'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Review *</label>
                <textarea
                  value={modal.data.body || ''}
                  onChange={(e) => set('body', e.target.value)}
                  rows={4}
                  className="input-luxe w-full resize-none"
                  placeholder="What did the customer say?"
                />
              </div>

              {/* Display order */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={modal.data.display_order ?? 0}
                  onChange={(e) => set('display_order', parseInt(e.target.value) || 0)}
                  className="input-luxe w-full"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="text-white/50 text-sm">Visible on homepage</label>
                <button
                  onClick={() => set('is_active', !modal.data.is_active)}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors',
                    modal.data.is_active ? 'bg-luxe-accent' : 'bg-white/20'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      modal.data.is_active ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Save */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-luxe-accent text-black font-semibold text-sm hover:bg-luxe-accent/90 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {modal.data.id ? 'Save Changes' : 'Add Testimonial'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}