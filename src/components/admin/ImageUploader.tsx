'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface UploadedImage {
  url: string;
  path?: string;   // storage path — present for newly uploaded files
  isPrimary?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 8 }: ImageUploaderProps) {
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
    return { url: json.url, path: json.path };
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

  const removeImage = async (i: number) => {
    const img = images[i];
    // Optionally delete from storage (fire-and-forget; non-blocking)
    if (img.path) {
      fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: img.path }),
      }).catch(() => {}); // best-effort
    }
    onChange(images.filter((_, j) => j !== i));
  };

  const canAddMore = images.length + uploading.length < maxImages;

  return (
    <div className="space-y-3">
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
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Thumbnails grid */}
      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div
              key={img.url}
              draggable
              onDragStart={() => onThumbDragStart(i)}
              onDragOver={(e) => onThumbDragOver(e, i)}
              onDrop={(e) => onThumbDrop(e, i)}
              onDragEnd={onThumbDragEnd}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border group cursor-grab active:cursor-grabbing transition-all duration-150',
                dragIndex === i && 'opacity-40 scale-95',
                dropIndex === i && dragIndex !== i && 'ring-2 ring-luxe-accent',
                i === 0 ? 'border-luxe-accent/60' : 'border-white/10'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />

              {/* Primary badge */}
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-luxe-accent text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}

              {/* Drag handle hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <GripVertical className="w-5 h-5 text-white/70" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploading.map((localUrl) => (
            <div
              key={localUrl}
              className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <Loader2 className="w-5 h-5 text-luxe-accent animate-spin" />
                <span className="text-white/30 text-[10px]">Uploading…</span>
              </div>
            </div>
          ))}

          {/* Add more tile */}
          {canAddMore && images.length > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-white/15 hover:border-white/30 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/50 transition-all"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px]">Add more</span>
            </button>
          )}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-white/25 text-xs">Drag thumbnails to reorder · First image is the main photo</p>
      )}
    </div>
  );
}