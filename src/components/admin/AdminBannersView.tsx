'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUploader, type UploadedImage } from './ImageUploader';
import type { Banner } from '@/types';

interface AdminBannersViewProps {
  banners: Banner[];
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

export function AdminBannersView({ banners: initial }: AdminBannersViewProps) {
  const [banners, setBanners] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Separate single-image uploaders for desktop + mobile
  const [desktopImages, setDesktopImages] = useState<UploadedImage[]>([]);
  const [mobileImages, setMobileImages] = useState<UploadedImage[]>([]);

  const openCreate = () => {
    setEditBanner(null);
    setForm({ ...emptyForm(), display_order: banners.length });
    setDesktopImages([]);
    setMobileImages([]);
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
    <div className="space-y-6">
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
                <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide mb-1.5 block">CTA URL</label>
                <input
                  value={form.cta_url}
                  onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
                  className="input-luxe"
                  placeholder="/posters"
                />
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