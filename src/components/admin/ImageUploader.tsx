'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2, GripVertical, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface UploadedImage {
  id?: string;
  url: string;
  storage_path?: string;
  is_primary?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onDelete?: (image: UploadedImage) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, onDelete, maxImages = 8 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]); // local object URLs being uploaded
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // ── Upload helpers ──────────────────────────────────────────────────────────

  const uploadFile = async (file: File): Promise<UploadedImage | null> => {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || 'Upload failed');
      return null;
    }
    return { url: json.url, storage_path: json.path, is_primary: false };
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!list.length) return;

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }
      const toUpload = list.slice(0, remaining);

      // Show local previews immediately while uploading
      const localUrls = toUpload.map((f) => URL.createObjectURL(f));
      setUploading((prev) => [...prev, ...localUrls]);

      const results = await Promise.all(toUpload.map((f) => uploadFile(f)));

      // Revoke object URLs
      localUrls.forEach((u) => URL.revokeObjectURL(u));
      setUploading((prev) => prev.filter((u) => !localUrls.includes(u)));

      const succeeded = results.filter(Boolean) as UploadedImage[];
      if (succeeded.length) {
        // If it's the very first image uploaded, make it primary automatically
        if (images.length === 0 && succeeded.length > 0) {
          succeeded[0].is_primary = true;
        }
        onChange([...images, ...succeeded]);
      }
    },
    [images, maxImages, onChange]
  );

  // ── Drag-and-drop into the zone ─────────────────────────────────────────────

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // ── Reorder by dragging thumbnails ─────────────────────────────────────────

  const onThumbDragStart = (i: number) => setDragIndex(i);
  const onThumbDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDropIndex(i);
  };
  const onThumbDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    onChange(next);
    setDragIndex(null);
    setDropIndex(null);
  };
  const onThumbDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const removeImage = (i: number) => {
    const img = images[i];
    if (onDelete) onDelete(img);
    
    const next = images.filter((_, j) => j !== i);
    // Auto-assign primary if we deleted the primary
    if (img.is_primary && next.length > 0) {
      next[0].is_primary = true;
    }
    onChange(next);
  };

  const setPrimary = (i: number) => {
    const next = images.map((img, idx) => ({
      ...img,
      is_primary: idx === i
    }));
    onChange(next);
  };

  const canAddMore = images.length + uploading.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Visual Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={img.url}
              draggable
              onDragStart={() => onThumbDragStart(i)}
              onDragOver={(e) => onThumbDragOver(e, i)}
              onDrop={(e) => onThumbDrop(e, i)}
              onDragEnd={onThumbDragEnd}
              className={cn(
                'group relative aspect-square rounded-xl overflow-hidden bg-white/5 border-2 transition-all cursor-move',
                dropIndex === i ? 'border-luxe-accent scale-105 shadow-xl' : 'border-transparent',
                img.is_primary ? 'ring-2 ring-luxe-accent ring-offset-2 ring-offset-luxe-black sm:col-span-2 sm:row-span-2' : ''
              )}
            >
              <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      img.is_primary ? "bg-luxe-accent text-luxe-black" : "bg-white/20 text-white hover:bg-luxe-accent hover:text-luxe-black"
                    )}
                    title="Set as Primary Cover"
                  >
                    <Star className={cn("w-4 h-4", img.is_primary ? "fill-luxe-black" : "")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <GripVertical className="w-5 h-5 text-white/50" />
                </div>
              </div>
              {img.is_primary && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-luxe-accent text-luxe-black text-[10px] font-bold uppercase tracking-wider rounded-md">
                  Cover
                </div>
              )}
            </div>
          ))}
          {uploading.map((url, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 flex items-center justify-center animate-pulse">
              <Loader2 className="w-6 h-6 text-luxe-accent animate-spin" />
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-8',
            dragOver
              ? 'border-luxe-accent bg-luxe-accent/10 scale-[1.01]'
              : 'border-white/15 hover:border-white/30 hover:bg-white/5'
          )}
        >
          <div className="p-3 rounded-full bg-white/5">
            <Upload className="w-5 h-5 text-white/40" />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">
              Drop images here or <span className="text-luxe-accent">browse</span>
            </p>
            <p className="text-white/25 text-xs mt-0.5">
              JPG, PNG, WebP · max 5 MB each · up to {maxImages} images
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}