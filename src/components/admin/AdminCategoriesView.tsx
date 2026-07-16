'use client';

import { useState } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Plus, Search, Tag, Edit3, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateSlug, cn } from '@/lib/utils';
import type { Category } from '@/types';

interface AdminCategoriesViewProps {
  initialCategories: Category[];
}

export function AdminCategoriesView({ initialCategories }: AdminCategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  useScrollLock(showModal);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    product_type: '',
    is_active: true,
  });

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.product_type.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.product_type.trim()) {
      return toast.error('Name and Product Type are required');
    }

    try {
      const slug = editCategory?.slug || generateSlug(formData.name);
      
      const payload = {
        name: formData.name.trim(),
        slug,
        product_type: formData.product_type.trim().toLowerCase(), // normalize to lowercase
        is_active: formData.is_active,
      };

      if (editCategory) {
        const res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editCategory.id, ...payload }),
        });
        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Category updated');
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Creation failed');
        const created = await res.json();
        setCategories(prev => [created, ...prev]);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditCategory(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This might break products linked to this category!')) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Categories</h1>
        <button
          onClick={() => { 
            setEditCategory(null); 
            setFormData({ name: '', product_type: '', is_active: true });
            setShowModal(true); 
          }}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search categories by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-luxe pl-9 text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cat) => (
          <div key={cat.id} className={cn("glass-card p-5 relative overflow-hidden", !cat.is_active && 'opacity-50')}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 text-luxe-accent">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{cat.name}</h3>
                  <p className="text-white/40 text-xs">/{cat.slug}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="badge-luxe text-xs font-mono">Type: {cat.product_type}</span>
            </div>

            <div className="flex gap-2 border-t border-white/5 pt-4">
              <button onClick={() => {
                setEditCategory(cat);
                setFormData({ name: cat.name, product_type: cat.product_type, is_active: cat.is_active });
                setShowModal(true);
              }} className="flex-1 btn-luxe-outline py-2 text-xs flex justify-center items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(cat.id)} className="px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex justify-center items-center">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md glass-card p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-semibold text-white">{editCategory ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Category Name *</label>
                <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="input-luxe" placeholder="e.g. Scented Candles" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Product Type (System ID) *</label>
                <input required value={formData.product_type} onChange={e => setFormData(p => ({ ...p, product_type: e.target.value }))} className="input-luxe font-mono text-sm" placeholder="e.g. candle" />
                <p className="text-white/30 text-[10px] mt-1.5 leading-tight">This tells the system what fields to display. You can type an existing type (poster, earring) or a brand new one (candle, mug).</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-luxe-accent" />
                <span className="text-white/60 text-sm">Active (Visible in store)</span>
              </label>
              
              <div className="pt-4 border-t border-white/10 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-luxe-outline flex-1">Cancel</button>
                <button type="submit" className="btn-gold flex-1">{editCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
