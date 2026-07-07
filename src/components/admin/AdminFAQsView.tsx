'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, X, Save, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FAQ } from '@/types';

interface AdminFAQsViewProps {
  faqs: FAQ[];
}

const EMPTY: Omit<FAQ, 'id' | 'created_at'> = {
  question: '',
  answer: '',
  category: '',
  display_order: 0,
  is_active: true,
};

export function AdminFAQsView({ faqs: initial }: AdminFAQsViewProps) {
  const [items, setItems] = useState<FAQ[]>(initial);
  const [modal, setModal] = useState<{ open: boolean; data: Partial<FAQ> & { id?: string } }>({
    open: false,
    data: { ...EMPTY },
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const openCreate = () =>
    setModal({ open: true, data: { ...EMPTY, display_order: items.length } });

  const openEdit = (f: FAQ) =>
    setModal({ open: true, data: { ...f } });

  const closeModal = () =>
    setModal({ open: false, data: { ...EMPTY } });

  const handleSave = async () => {
    const { id, ...body } = modal.data;
    if (!body.question?.trim()) { toast.error('Question is required'); return; }
    if (!body.answer?.trim()) { toast.error('Answer is required'); return; }

    setSaving(true);
    try {
      if (id) {
        const res = await fetch('/api/admin/faqs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...body }),
        });
        if (!res.ok) throw new Error();
        const updated: FAQ = await res.json();
        setItems((prev) => prev.map((f) => (f.id === id ? updated : f)));
        toast.success('FAQ updated');
      } else {
        const res = await fetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const created: FAQ = await res.json();
        setItems((prev) => [...prev, created]);
        toast.success('FAQ added');
      }
      closeModal();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((f) => f.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (f: FAQ) => {
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: f.id, is_active: !f.is_active }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, is_active: !item.is_active } : item))
        );
        toast.success(f.is_active ? 'FAQ hidden' : 'FAQ visible');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to toggle status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error toggling status');
    }
  };

  const moveOrder = async (f: FAQ, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === f.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];

    await Promise.all([
      fetch('/api/admin/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: f.id, display_order: other.display_order }),
      }),
      fetch('/api/admin/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: other.id, display_order: f.display_order }),
      }),
    ]);

    const newItems = [...items];
    newItems[idx] = { ...f, display_order: other.display_order };
    newItems[swapIdx] = { ...other, display_order: f.display_order };
    newItems.sort((a, b) => a.display_order - b.display_order);
    setItems(newItems);
  };

  const set = (key: keyof typeof EMPTY, val: unknown) =>
    setModal((prev) => ({ ...prev, data: { ...prev.data, [key]: val } }));

  // Group by category for display
  const categories = Array.from(new Set(items.map((f) => f.category || 'General'))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">FAQs</h1>
          <p className="text-white/40 text-sm mt-1">
            {items.length} total · {items.filter((f) => f.is_active).length} active
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-luxe-accent text-black font-semibold text-sm hover:bg-luxe-accent/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HelpCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No FAQs yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f, idx) => (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('glass-card overflow-hidden', !f.is_active && 'opacity-50')}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Order controls */}
                <div className="flex flex-col gap-1 pt-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveOrder(f, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white/20 text-[10px] text-center">{f.display_order}</span>
                  <button
                    onClick={() => moveOrder(f, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                      className="text-white text-sm font-medium text-left hover:text-luxe-accent transition-colors"
                    >
                      {f.question}
                    </button>
                    {f.category && (
                      <span className="badge-luxe text-[10px] flex-shrink-0">{f.category}</span>
                    )}
                  </div>

                  <AnimatePresence>
                    {expanded === f.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-white/50 text-sm mt-2 leading-relaxed">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(f)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      f.is_active
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-white/30 hover:bg-white/5'
                    )}
                    title={f.is_active ? 'Hide' : 'Show'}
                  >
                    {f.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(f)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId === f.id}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                  {modal.data.id ? 'Edit FAQ' : 'Add FAQ'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Question */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Question *</label>
                <input
                  value={modal.data.question || ''}
                  onChange={(e) => set('question', e.target.value)}
                  className="input-luxe w-full"
                  placeholder="e.g. How long does delivery take?"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Answer *</label>
                <textarea
                  value={modal.data.answer || ''}
                  onChange={(e) => set('answer', e.target.value)}
                  rows={4}
                  className="input-luxe w-full resize-none"
                  placeholder="Provide a clear, helpful answer..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">
                  Category <span className="text-white/20">(optional)</span>
                </label>
                <input
                  value={modal.data.category || ''}
                  onChange={(e) => set('category', e.target.value)}
                  className="input-luxe w-full"
                  placeholder="e.g. Shipping, Returns, Products"
                  list="faq-categories"
                />
                <datalist id="faq-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
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
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white transition-all"
                >
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
                  {modal.data.id ? 'Save Changes' : 'Add FAQ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}