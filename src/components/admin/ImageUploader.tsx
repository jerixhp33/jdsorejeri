'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2, GripVertical, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { createClient } from '@/lib/supabase/client';

export interface UploadedImage {
  id?: string;
  url: string;
  storage_path?: string;
  is_primary?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
  onDelete?: (image: UploadedImage) => void;
  maxImages?: number;
  bucketName?: string;
}

export function ImageUploader({ images, onChange, onDelete, maxImages = 8, bucketName = 'product-images' }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  
    // Track local object URLs being uploaded along with their progress percentage
  const [uploadingFiles, setUploadingFiles] = useState<{ url: string; progress: number, type: string }[]>([]); 
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // ── Upload helpers ──────────────────────────────────────────────────────────

  const uploadFile = (file: File, localUrl: string): Promise<UploadedImage | null> => {
    return new Promise(async (resolve) => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("Unauthorized");
          return resolve(null);
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucketName}/${path}`;
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadingFiles(prev => prev.map(f => f.url === localUrl ? { ...f, progress: pct } : f));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
            resolve({ url: data.publicUrl, storage_path: path, is_primary: false });
          } else {
            console.error("Upload error:", xhr.responseText);
            toast.error("Upload failed: " + xhr.responseText);
            resolve(null);
          }
        };
        
        xhr.onerror = () => {
          toast.error("Network error during upload");
          resolve(null);
        };

        xhr.send(file);
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
        resolve(null);
      }
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
      if (!list.length) return;

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }
      const toUpload = list.slice(0, remaining);

      // Create tracking objects for UI
      const tracking = toUpload.map(f => ({ url: URL.createObjectURL(f), progress: 0, type: f.type }));
      setUploadingFiles((prev) => [...prev, ...tracking]);

      const results = await Promise.all(
        toUpload.map((f, index) => uploadFile(f, tracking[index].url))
      );

      // Clean up object URLs and UI state
      tracking.forEach((t) => URL.revokeObjectURL(t.url));
      setUploadingFiles((prev) => prev.filter((p) => !tracking.find(t => t.url === p.url)));

      const succeeded = results.filter(Boolean) as UploadedImage[];
      if (succeeded.length) {
        onChange(prev => {
          // Auto-primary logic for new arrays
          const next = [...prev, ...succeeded];
          if (prev.length === 0 && next.length > 0) {
            next[0].is_primary = true;
          }
          return next;
        });
      }
    },
    [images, maxImages, onChange, bucketName]
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

  const canAddMore = images.length + uploadingFiles.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Visual Grid */}
      {(images.length > 0 || uploadingFiles.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id || `${img.url}-${i}`}
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
              {(() => {
                const isVideo = img.url?.split('?')[0].match(/\.(mp4|webm|ogg)$/i) || img.url.startsWith('blob:') && img.url.includes('video'); // Very basic blob check might not work for type, but extensions will for uploaded
                if (isVideo) {
                  return (
                    <video src={img.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  );
                }
                return <img src={img.url} alt="Preview" className="w-full h-full object-cover" />;
              })()}
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
          {uploadingFiles.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
              {(() => {
                const isVideo = f.type.startsWith('video/');
                if (isVideo) {
                   return <video src={f.url} className="w-full h-full object-cover opacity-50 grayscale" autoPlay loop muted playsInline />
                }
                return <img src={f.url} alt="Uploading" className="w-full h-full object-cover opacity-50 grayscale" />
              })()}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                <Loader2 className="w-5 h-5 text-luxe-accent animate-spin mb-3 shadow-lg" />
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-luxe-accent transition-all duration-300"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white mt-1.5">{f.progress}%</span>
              </div>
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
              Drop files here or <span className="text-luxe-accent">browse</span>
            </p>
            <p className="text-white/25 text-xs mt-0.5">
              JPG, PNG, WebP, MP4, WebM · max 10 MB each · up to {maxImages} files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = ''; // Reset so the same file can be selected again
            }}
          />
        </div>
      )}
    </div>
  );
}