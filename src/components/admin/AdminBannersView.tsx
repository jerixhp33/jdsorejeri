'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUploader, type UploadedImage } from './ImageUploader';
import type { Banner } from '@/types';

interface AdminBannersViewProps {
  banners: Banner[];
  products?: { id: string; name: string; slug: string; product_type: string }[];
  categories?: { id: string; name: string; slug: string; product_type: string }[];
}

const POSITIONS = ['hero', 'top', 'middle', 'bottom', 'sidebar'] as const;

const emptyForm = () => ({
  title: '',
  subtitle: '',
  cta_text: '',
  cta_url: '',
  position: 'hero' as Banner['position'],
  is_active: true,
  display_order: 0,
});

export function AdminBannersView({ banners: initial, products = [], categories = [] }: AdminBannersViewProps) {
  const [banners, setBanners] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  
  useScrollLock(showModal);
  
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Separate single-image uploaders for desktop + mobile
  const [desktopImages, setDesktopImages] = useState<UploadedImage[]>([]);
  const [mobileImages, setMobileImages] = useState<UploadedImage[]>([]);

  // CTA Dropdown state
  const [linkType, setLinkType] = useState<'product' | 'category' | 'custom'>('custom');
  const [productTypeFilter, setProductTypeFilter] = useState('');

  const openCreate = () => {
    setEditBanner(null);
    setForm({ ...emptyForm(), display_order: banners.length });
    setDesktopImages([]);
    setMobileImages([]);
    setLinkType('custom');
    setProductTypeFilter('');
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      cta_text: banner.cta_text || '',
      cta_url: banner.cta_url || '',
      position: banner.position,
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setDesktopImages(banner.image_url ? [{ url: banner.image_url }] : []);
    setMobileImages(banner.mobile_image_url ? [{ url: banner.mobile_image_url }] : []);
    
    if (banner.cta_url?.startsWith('/product/')) {
      setLinkType('product');
      const p = products.find(p => `/product/${p.slug}` === banner.cta_url);
      setProductTypeFilter(p?.product_type || '');
    } else if (banner.cta_url?.startsWith('/category/')) {
      setLinkType('category');
      const categoryId = banner.cta_url.includes('?category=') 
        ? new URLSearchParams(banner.cta_url.split('?')[1]).get('category') 
        : null;
      const c = categories.find(c => (categoryId ? c.id === categoryId : `/category/${c.slug}` === banner.cta_url));
      setProductTypeFilter(c?.product_type || '');
    } else {
      setLinkType('custom');
      setProductTypeFilter('');
    }
    
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    if (desktopImages.length === 0) { toast.error('Desktop image is required'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        image_url: desktopImages[0].url,
        mobile_image_url: mobileImages[0]?.url || null,
      };

      if (editBanner) {
        const res = await fetch('/api/admin/banners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editBanner.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setBanners(prev => prev.map(b => b.id === editBanner.id ? data as Banner : b));
        toast.success('Banner updated');
      } else {
        const res = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setBanners(prev => [...prev, data as Banner]);
        toast.success('Banner created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    const res = await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: banner.id, is_active: !banner.is_active }),
    });
    if (res.ok) {
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    const res = await fetch('/api/admin/banners', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success('Banner deleted');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Banners</h1>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((banner, i) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn('glass-card overflow-hidden', !banner.is_active && 'opacity-60')}
          >
            <div className="relative aspect-video bg-luxe-dark">
              {banner.image_url ? (
                (() => {
                  const isVideo = banner.image_url?.split('?')[0].match(/\.(mp4|webm|ogg)$/i);
                  if (isVideo) {
                    return <video src={banner.image_url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />;
                  }
                  return <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />;
                })()
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/10 text-4xl">🖼</div>
              )}
              <div className="absolute top-2 left-2">
                <span className="badge-luxe text-[10px] capitalize">{banner.position}</span>
              </div>
              {!banner.is_active && (
                <div className="absolute top-2 right-2">
                  <span className="badge-luxe !bg-red-500/20 !text-red-400 !border-red-500/30 text-[10px]">Hidden</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-white font-medium text-sm mb-0.5">{banner.title}</p>
              {banner.subtitle && <p className="text-white/40 text-xs mb-2">{banner.subtitle}</p>}
              {banner.cta_text && (
                <p className="text-luxe-accent text-xs mb-3">CTA: {banner.cta_text} → {banner.cta_url}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(banner)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs transition-all"
                >
                  <Edit2 className="w-3 h-3" />Edit
                </button>
                <button onClick={() => toggleActive(banner)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-all">
                  {banner.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full glass-card p-16 text-center text-white/30">
            No banners yet. Create one to display on the store.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">{editBanner ? 'Edit Banner' : 'New Banner'}</h2>

            {/* Title & subtitle */}
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-luxe"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  className="input-luxe"
                  placeholder="Optional subtitle"
                />
              </div>
            </div>

            {/* Desktop image upload */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide mb-2 block">
                Desktop Image *
              </label>
              <ImageUploader images={desktopImages} onChange={setDesktopImages} maxImages={1} />
            </div>

            {/* Mobile image upload */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide mb-2 block">
                Mobile Image
                <span className="text-white/25 normal-case ml-1">(optional — falls back to desktop)</span>
              </label>
              <ImageUploader images={mobileImages} onChange={setMobileImages} maxImages={1} />
            </div>

            {/* CTA + position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">CTA Text</label>
                <input
                  value={form.cta_text}
                  onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
                  className="input-luxe"
                  placeholder="Shop Now"
                />
              </div>
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Link Type</label>
                  <select
                    value={linkType}
                    onChange={e => {
                      setLinkType(e.target.value as any);
                      setForm(f => ({ ...f, cta_url: '' })); // reset URL when type changes
                    }}
                    className="input-luxe"
                  >
                    <option value="product">Product</option>
                    <option value="category">Category</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>
                
                {linkType !== 'custom' && (
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Filter by Type</label>
                    <select
                      value={productTypeFilter}
                      onChange={e => {
                        setProductTypeFilter(e.target.value);
                        setForm(f => ({ ...f, cta_url: '' })); // reset URL when filter changes
                      }}
                      className="input-luxe capitalize"
                    >
                      <option value="">All Types</option>
                      <option value="poster">Poster</option>
                      <option value="earring">Earring</option>
                      <option value="bracelet">Bracelet</option>
                      <option value="hairband">Hairband</option>
                      <option value="keychain">Keychain</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div className={linkType === 'custom' ? "col-span-2" : "col-span-2 md:col-span-1"}>
                  <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">CTA URL Target</label>
                  {linkType === 'custom' ? (
                    <input
                      value={form.cta_url}
                      onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
                      className="input-luxe"
                      placeholder="/about"
                    />
                  ) : linkType === 'product' ? (
                    <select
                      value={form.cta_url}
                      onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
                      className="input-luxe"
                    >
                      <option value="">Select Product...</option>
                      {products
                        .filter(p => !productTypeFilter || p.product_type === productTypeFilter)
                        .map(p => (
                          <option key={p.id} value={`/product/${p.slug}`}>{p.name}</option>
                        ))
                      }
                    </select>
                  ) : (
                    <select
                      value={form.cta_url}
                      onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
                      className="input-luxe"
                    >
                      <option value="">Select Category...</option>
                      {categories
                        .filter(c => !productTypeFilter || c.product_type === productTypeFilter)
                        .map(c => (
                          <option key={c.id} value={`/category/${c.product_type}?category=${c.id}`}>{c.name}</option>
                        ))
                      }
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Position</label>
                <select
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value as any }))}
                  className="input-luxe capitalize"
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                  className="input-luxe"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bannerActive"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-luxe-accent"
              />
              <label htmlFor="bannerActive" className="text-white/60 text-sm cursor-pointer">
                Active (visible on store)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-luxe-outline flex-1 text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-gold flex-1 text-sm">
                {saving ? 'Saving...' : editBanner ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
