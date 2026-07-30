'use client';

import React, { useState } from 'react';
import type { HomeThemeConfig } from '@/lib/theme';
import { upsertHomeTheme, deleteHomeTheme, uploadThemeAsset } from './actions';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Sparkles, Upload, X, Image as ImageIcon, Video, Check } from 'lucide-react';

function FileUploadZone({
  label,
  accept,
  currentUrl,
  mediaType = 'image',
  onUpload,
  onRemove,
  description,
}: {
  label: string;
  accept: string;
  currentUrl?: string | null;
  mediaType?: 'image' | 'video';
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  description?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processFile = async (file: File) => {
    setUploading(true);
    setProgress(15);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);

    try {
      await onUpload(file);
      setProgress(100);
    } catch {
      toast.error('Upload failed');
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 300);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file) {
      e.preventDefault();
      processFile(file);
      toast.success('Pasted file from clipboard!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">{label}</label>

      {currentUrl ? (
        <div className="relative rounded-2xl border border-white/10 bg-black/60 p-3 flex items-center justify-between group overflow-hidden shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-black/80 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              {mediaType === 'video' || currentUrl.match(/\.(mp4|webm)$/i) ? (
                <video src={currentUrl} className="w-full h-full object-cover" muted loop autoPlay />
              ) : (
                <img src={currentUrl} alt="Preview" className="w-full h-full object-contain p-1" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                {currentUrl.split('/').pop()?.split('?')[0] || 'Uploaded Asset'}
              </p>
              <span className="text-[10px] text-green-400 font-medium flex items-center gap-1 mt-0.5">
                <Check size={10} /> Active Preview
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition">
              Replace
              <input type="file" accept={accept} onChange={handleChange} className="hidden" />
            </label>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer outline-none ${
            isDragging
              ? 'border-luxe-accent bg-luxe-accent/10 scale-[1.01]'
              : 'border-white/15 hover:border-white/30 bg-black/30 hover:bg-black/50'
          }`}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-luxe-accent">
              <Upload size={18} />
            </div>
            <p className="text-xs font-semibold text-white">
              Drag & Drop file here, or <span className="text-luxe-accent underline">Browse</span>
            </p>
            <p className="text-[11px] text-white/40">
              {description || 'Press Ctrl+V to paste file directly from clipboard'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-white/60">
            <span>Uploading to Supabase Storage...</span>
            <span className="font-semibold text-luxe-accent">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-luxe-accent to-yellow-300 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ThemeAdminClient({ initialThemes }: { initialThemes: HomeThemeConfig[] }) {
  const [themes, setThemes] = useState(initialThemes);
  const [isEditing, setIsEditing] = useState<Partial<HomeThemeConfig> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    setLoading(true);

    const res = await upsertHomeTheme(isEditing);
    if (res.success) {
      toast.success('Theme saved & activated on Home Page!');
      setIsEditing(null);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to save theme');
    }
    setLoading(false);
  };

  const handleToggle = async (theme: HomeThemeConfig, checked: boolean) => {
    const res = await upsertHomeTheme({ ...theme, is_active: checked });
    if (res.success) {
      toast.success(`Theme ${checked ? 'activated' : 'deactivated'}`);
      setThemes(themes.map(t => t.id === theme.id ? { ...t, is_active: checked } : t));
    } else {
      toast.error('Failed to toggle theme');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this theme config?')) return;
    const res = await deleteHomeTheme(id);
    if (res.success) {
      toast.success('Theme deleted');
      setThemes(themes.filter(t => t.id !== id));
    } else {
      toast.error('Failed to delete theme');
    }
  };

  const handlePngFile = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadThemeAsset(fd);
    if (res.success && res.url) {
      setIsEditing(prev => ({ ...prev, element_image_url: res.url }));
      toast.success('Falling element PNG uploaded!');
    } else {
      toast.error(res.error || 'Upload failed');
    }
  };

  const handleMediaFile = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const isVideo = file.type.startsWith('video/');

    const res = await uploadThemeAsset(fd);
    if (res.success && res.url) {
      setIsEditing(prev => ({
        ...prev,
        hero_side_media_url: res.url,
        hero_side_media_type: isVideo ? 'video' : 'image',
      }));
      toast.success('Hero right-side media uploaded!');
    } else {
      toast.error(res.error || 'Upload failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-luxe-accent" />
            Home Theme & Atmosphere
          </h2>
          <p className="text-white/40 text-xs mt-1">
            Configure custom falling PNG particles, aura glow colors, text accents, and hero side media.
          </p>
        </div>
        <button
          onClick={() =>
            setIsEditing({
              title: 'Custom Festival Theme',
              is_active: true,
              glow_primary_color: 'rgba(0, 242, 254, 0.55)',
              glow_secondary_color: 'rgba(240, 147, 251, 0.55)',
              text_accent_color: '#c8a96e',
              element_size: 32,
              element_count: 25,
              element_speed: 'medium',
              element_direction: 'fall',
              hero_side_media_type: 'image',
            })
          }
          className="flex items-center gap-2 bg-luxe-accent text-black px-4 py-2.5 rounded-xl font-semibold hover:bg-luxe-accent/90 transition shadow-lg text-sm"
        >
          <Plus size={18} />
          New Theme Config
        </button>
      </div>

      {/* Theme List Table */}
      <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#161616] border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">PNG Particle</th>
              <th className="p-4 font-medium">Hero Media</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {themes.map(theme => {
              const now = new Date();
              const start = new Date(theme.start_at);
              const end = new Date(theme.end_at);
              const isRunning = theme.is_active && now >= start && now < end;

              return (
                <tr key={theme.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <p className="text-white font-medium">{theme.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: theme.text_accent_color || '#c8a96e' }} />
                      <span className="text-xs text-white/40">{theme.text_accent_color}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {theme.element_image_url ? (
                      <div className="flex items-center gap-2">
                        <img src={theme.element_image_url} alt="Element" className="w-7 h-7 object-contain bg-black/40 p-1 rounded border border-white/10" />
                        <span className="text-xs text-white/60">{theme.element_size}px ({theme.element_count} items)</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/30">None (Default Glow)</span>
                    )}
                  </td>
                  <td className="p-4">
                    {theme.hero_side_media_url ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 text-xs text-white/80 capitalize">
                        {theme.hero_side_media_type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                        {theme.hero_side_media_type}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">Standard Layout</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-luxe-accent"
                        checked={theme.is_active}
                        onChange={e => handleToggle(theme, e.target.checked)}
                      />
                      <span className={`text-xs ${isRunning ? 'text-green-400 font-semibold' : 'text-white/40'}`}>
                        {isRunning ? 'Active on Home' : theme.is_active ? 'Scheduled' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setIsEditing(theme)} className="p-2 text-white/50 hover:text-white transition">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(theme.id!)} className="p-2 text-white/50 hover:text-red-400 transition ml-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {themes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/40">
                  No theme configs created yet. Click "New Theme Config" to customize the Home Page!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Form Panel */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditing(null)} />
        <div className={`absolute top-0 right-0 h-[100dvh] w-full max-w-lg bg-[#111] border-l border-white/10 shadow-2xl transition-transform duration-300 transform ${isEditing ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-luxe-accent" />
              {isEditing?.id ? 'Edit Theme Config' : 'New Theme Config'}
            </h3>
            <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {/* Form Scroll Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form id="theme-form" onSubmit={handleSave} className="space-y-6">

              {/* Title & Active */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-luxe-accent uppercase tracking-wider">General</h4>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Theme Title</label>
                  <input
                    type="text"
                    value={isEditing?.title || ''}
                    onChange={e => setIsEditing({ ...isEditing, title: e.target.value })}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-luxe-accent text-sm transition"
                    placeholder="e.g. Festival Season Theme"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isEditing?.is_active ?? true}
                    onChange={e => setIsEditing({ ...isEditing, is_active: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-luxe-accent"
                  />
                  <label className="text-sm text-white/80">Active / Enabled</label>
                </div>
              </div>

              {/* Drag & Drop / Paste Falling PNG Element Upload */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <FileUploadZone
                  label="Falling Element (Transparent PNG)"
                  accept="image/png,image/webp"
                  currentUrl={isEditing?.element_image_url}
                  mediaType="image"
                  onUpload={handlePngFile}
                  onRemove={() => setIsEditing(prev => ({ ...prev, element_image_url: undefined }))}
                  description="Drag & drop PNG image here, or press Ctrl+V to paste from clipboard"
                />

                {isEditing?.element_image_url && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Element Size ({isEditing.element_size || 32}px)</label>
                      <input
                        type="range"
                        min="16"
                        max="64"
                        value={isEditing.element_size || 32}
                        onChange={e => setIsEditing({ ...isEditing, element_size: parseInt(e.target.value, 10) })}
                        className="w-full accent-luxe-accent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Item Count ({isEditing.element_count || 25})</label>
                      <input
                        type="range"
                        min="10"
                        max="45"
                        value={isEditing.element_count || 25}
                        onChange={e => setIsEditing({ ...isEditing, element_count: parseInt(e.target.value, 10) })}
                        className="w-full accent-luxe-accent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Speed</label>
                      <select
                        value={isEditing.element_speed || 'medium'}
                        onChange={e => setIsEditing({ ...isEditing, element_speed: e.target.value as any })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      >
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Direction</label>
                      <select
                        value={isEditing.element_direction || 'fall'}
                        onChange={e => setIsEditing({ ...isEditing, element_direction: e.target.value as any })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      >
                        <option value="fall">Falling Down</option>
                        <option value="float">Floating Up</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Drag & Drop / Paste Hero Right Side Media Slot */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <FileUploadZone
                  label="Hero Right-Side Media Slot (Video MP4 / Image)"
                  accept="image/*,video/mp4,video/webm"
                  currentUrl={isEditing?.hero_side_media_url}
                  mediaType={isEditing?.hero_side_media_type || 'image'}
                  onUpload={handleMediaFile}
                  onRemove={() => setIsEditing(prev => ({ ...prev, hero_side_media_url: undefined }))}
                  description="Drag & drop Video or Image here, or press Ctrl+V to paste"
                />

                {isEditing?.hero_side_media_url && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Title / Heading</label>
                      <input
                        type="text"
                        value={isEditing.hero_side_title || ''}
                        onChange={e => setIsEditing({ ...isEditing, hero_side_title: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs"
                        placeholder="e.g. Exclusive Collection"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Click Destination Link URL</label>
                      <input
                        type="text"
                        value={isEditing.hero_side_link_url || ''}
                        onChange={e => setIsEditing({ ...isEditing, hero_side_link_url: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs"
                        placeholder="e.g. /collections/festive"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Colors & Aura Glow */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-luxe-accent uppercase tracking-wider">Aura Glow & Text Colors</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase">Text Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={isEditing?.text_accent_color || '#c8a96e'}
                        onChange={e => setIsEditing({ ...isEditing, text_accent_color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={isEditing?.text_accent_color || '#c8a96e'}
                        onChange={e => setIsEditing({ ...isEditing, text_accent_color: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer Submit */}
          <div className="p-6 border-t border-white/10 bg-[#111] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(null)}
              className="px-5 py-2.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition text-sm"
            >
              Cancel
            </button>
            <button
              form="theme-form"
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-semibold bg-luxe-accent text-black hover:bg-luxe-accent/90 transition text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
