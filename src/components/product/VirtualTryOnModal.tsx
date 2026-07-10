'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
}

export function VirtualTryOnModal({ isOpen, onClose, posterUrl }: VirtualTryOnModalProps) {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  // Clear bg image on close
  useEffect(() => {
    if (!isOpen) {
      if (bgImage) URL.revokeObjectURL(bgImage);
      setBgImage(null);
      setScale(1);
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const url = URL.createObjectURL(file);
    setBgImage(url);
  };

  const handleSave = async () => {
    if (!bgImage || !containerRef.current || !posterRef.current || !bgImageRef.current) return;
    setSaving(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
        bgImg.src = bgImage;
      });

      const posterImg = new Image();
      posterImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        posterImg.onload = resolve;
        posterImg.onerror = reject;
        posterImg.src = posterUrl;
      });

      canvas.width = bgImg.width;
      canvas.height = bgImg.height;

      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const containerRect = containerRef.current.getBoundingClientRect();
      const posterRect = posterRef.current.getBoundingClientRect();
      const bgRenderedRect = bgImageRef.current.getBoundingClientRect();

      const bgRatio = bgImg.width / bgImg.height;
      const containerRatio = containerRect.width / containerRect.height;
      
      let renderedWidth, renderedHeight, renderedX, renderedY;
      
      if (containerRatio > bgRatio) {
        renderedHeight = containerRect.height;
        renderedWidth = renderedHeight * bgRatio;
        renderedX = containerRect.left + (containerRect.width - renderedWidth) / 2;
        renderedY = containerRect.top;
      } else {
        renderedWidth = containerRect.width;
        renderedHeight = renderedWidth / bgRatio;
        renderedX = containerRect.left;
        renderedY = containerRect.top + (containerRect.height - renderedHeight) / 2;
      }

      const scaleX = canvas.width / renderedWidth;
      const scaleY = canvas.height / renderedHeight;

      const posterRenderX = posterRect.left - renderedX;
      const posterRenderY = posterRect.top - renderedY;

      const drawX = posterRenderX * scaleX;
      const drawY = posterRenderY * scaleY;
      const drawWidth = posterRect.width * scaleX;
      const drawHeight = posterRect.height * scaleY;

      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 40 * scaleX;
      ctx.shadowOffsetX = 10 * scaleX;
      ctx.shadowOffsetY = 20 * scaleY;

      ctx.drawImage(posterImg, drawX, drawY, drawWidth, drawHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = 'jd-store-virtual-try-on.jpg';
      link.href = dataUrl;
      link.click();
      
      toast.success('Saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10 z-10">
            <h3 className="font-display text-xl text-white font-semibold">Virtual Try-On</h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative overflow-hidden" ref={containerRef}>
            {!bgImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <ImageIcon className="w-8 h-8 text-white/40" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">Upload a photo of your wall</h4>
                <p className="text-white/50 text-sm mb-8 max-w-sm">
                  Take a photo of where you want to hang this poster to see how it looks in your room.
                </p>
                <label className="btn-luxe flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Take or Choose Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            ) : (
              <>
                {/* Background Image */}
                <img 
                  ref={bgImageRef}
                  src={bgImage} 
                  alt="Your wall" 
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Draggable Poster */}
                <motion.img
                  ref={posterRef}
                  src={posterUrl}
                  alt="Poster"
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0}
                  dragMomentum={false}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: scale * 0.5, opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: '25%',
                    left: '50%',
                    x: '-50%',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 10px 20px -5px rgba(0,0,0,0.4)',
                    cursor: 'grab',
                    touchAction: 'none'
                  }}
                  whileDrag={{ cursor: 'grabbing', scale: scale * 0.52 }}
                  className="max-h-[80vh] w-auto border-4 border-white/5 bg-white/5"
                  crossOrigin="anonymous"
                />

                {/* Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 z-10">
                  <button 
                    onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <div className="text-white/80 font-medium text-sm w-12 text-center">
                    {Math.round(scale * 100)}%
                  </div>
                  <button 
                    onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
                    className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  
                  <div className="w-px h-8 bg-white/20 mx-1" />
                  
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-luxe-accent text-black font-semibold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    Save
                  </button>
                </div>

                {/* Change photo button */}
                <label className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-sm hover:text-white hover:bg-white/10 transition-all cursor-pointer z-10">
                  Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
