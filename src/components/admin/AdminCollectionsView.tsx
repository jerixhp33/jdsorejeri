'use client';

import { useState } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Layers } from 'lucide-react';
import { generateSlug, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUploader, type UploadedImage } from './ImageUploader';
import type { Collection } from '@/types';

interface AdminCollectionsViewProps {
  collections: any[];
  allProducts: Array<{ id: string; name: string; product_type: string; slug: string; images?: string[] }>;
}

export function AdminCollectionsView({ collections: initial, allProducts }: AdminCollectionsViewProps) {
  const [collections, setCollections] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  useScrollLock(showModal);
  const [editCollection, setEditCollection] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', is_active: true, display_order: 0 });
  const [coverImages, setCoverImages] = useState<UploadedImage[]>([]);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditCollection(null);
    setSelectedProducts([]);
    setCoverImages([]);
    setForm({ name: '', description: '', is_active: true, display_order: collections.length });
    setShowModal(true);
  };

  const openEdit = (col: any) => {
    setEditCollection(col);
    setSelectedProducts((col.products || []).map((p: any) => p.product_id));
    setCoverImages(col.cover_image_url ? [{ url: col.cover_image_url }] : []);
    setForm({
      name: col.name,
      description: col.description || '',
      is_active: col.is_active,
      display_order: col.display_order,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const slug = editCollection?.slug || generateSlug(form.name);
      const payload = {
        ...form,
        slug,
        cover_image_url: coverImages[0]?.url || null,
      };
      let collectionId: string;

      if (editCollection) {
        const r = await fetch('/api/admin/collections', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editCollection.id, ...payload }),
        });
        if (!r.ok) throw new Error((await r.json()).error || 'Failed');
        collectionId = editCollection.id;
      } else {
        const r = await fetch('/api/admin/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error((await r.json()).error || 'Failed');
        const data = await r.json();
        collectionId = data.id;
      }

      // Sync products
      await fetch('/api/admin/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'products', collection_id: collectionId }),
      });
      if (selectedProducts.length > 0) {
        await fetch('/api/admin/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _type: 'collection_products',
            items: selectedProducts.map((pid, i) => ({
              collection_id: collectionId,
              product_id: pid,
              display_order: i,
            })),
          }),
        });
      }

      toast.success(editCollection ? 'Collection updated' : 'Collection created');
      setShowModal(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (col: any) => {
    try {
      const r = await fetch('/api/admin/collections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: col.id, is_active: !col.is_active }),
      });
      if (r.ok) {
        setCollections(prev => prev.map(c => c.id === col.id ? { ...c, is_active: !c.is_active } : c));
        toast.success(col.is_active ? 'Collection hidden' : 'Collection visible');
      } else {
        const data = await r.json();
        toast.error(data.error || 'Failed to toggle status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error toggling status');
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    const r = await fetch('/api/admin/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (r.ok) {
      setCollections(prev => prev.filter(c => c.id !== id));
      toast.success('Collection deleted');
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const filteredProducts = allProducts.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Collections</h1>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Collection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((col, i) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn('glass-card overflow-hidden', !col.is_active && 'opacity-60')}
          >
            {/* Cover image strip */}
            {col.cover_image_url ? (
              <div className="relative h-28 bg-luxe-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={col.cover_image_url} alt={col.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            ) : (
              <div className="h-14 bg-luxe-accent/5 flex items-center justify-center">
                <Layers className="w-5 h-5 text-luxe-accent/30" />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-white font-medium">{col.name}</h3>
                {!col.is_active && (
                  <span className="badge-luxe !bg-red-500/20 !text-red-400 !border-red-500/30 text-[10px] shrink-0">Hidden</span>
                )}
              </div>
              {col.description && <p className="text-white/40 text-xs mb-2 line-clamp-2">{col.description}</p>}
              <p className="text-white/30 text-xs mb-3">{(col.products || []).length} products</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(col)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs transition-all"
                >
                  <Edit2 className="w-3 h-3" />Edit
                </button>
                <button onClick={() => toggleActive(col)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-all">
                  {col.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => deleteCollection(col.id)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {collections.length === 0 && (
          <div className="col-span-full glass-card p-16 text-center text-white/30">No collections yet.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/10 bg-luxe-dark/90 backdrop-blur">
              <h2 className="text-white font-semibold">{editCollection ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white text-xl">×</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-luxe"
                  placeholder="Collection name"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-luxe resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              {/* Cover image uploader */}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-2 block">Cover Image</label>
                <ImageUploader images={coverImages} onChange={setCoverImages} maxImages={1} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                    className="input-luxe"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="colActive"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-luxe-accent"
                  />
                  <label htmlFor="colActive" className="text-white/60 text-sm cursor-pointer">Active</label>
                </div>
              </div>

              {/* Products selection */}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-2 block">
                  Products ({selectedProducts.length} selected)
                </label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="input-luxe text-sm mb-2"
                />
                <div className="max-h-48 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2">
                  {filteredProducts.map(product => (
                    <label key={product.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="w-3.5 h-3.5 accent-luxe-accent mr-2 shrink-0"
                      />
                      {product.images?.[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={product.images[0]} alt="" className="w-8 h-8 object-cover rounded-md shrink-0 bg-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                          <Layers className="w-3 h-3 text-white/20" />
                        </div>
                      )}
                      <span className="text-white/70 text-sm flex-1 truncate ml-1">{product.name}</span>
                      <span className="text-white/30 text-xs capitalize">{product.product_type}</span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-white/30 text-sm p-2">No products found</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-luxe-outline flex-1 text-sm">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-gold flex-1 text-sm">
                  {saving ? 'Saving...' : editCollection ? 'Save Changes' : 'Create Collection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}