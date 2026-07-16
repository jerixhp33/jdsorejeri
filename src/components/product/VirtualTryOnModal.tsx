'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, ZoomIn, ZoomOut, Image as ImageIcon, Sparkles, ShoppingCart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

// High-quality, aesthetic default room canvases from Unsplash
const DEFAULT_CANVASES = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80', // Modern living room
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', // Minimalist clean wall
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80'  // Moody dark interior
];

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
  currentProduct: Product;
}

export function VirtualTryOnModal({ isOpen, onClose, posterUrl, currentProduct }: VirtualTryOnModalProps) {
  const [wallImage, setWallImage] = useState<string>(DEFAULT_CANVASES[0]);
  const [isCustomWall, setIsCustomWall] = useState(false);
  const [canvasIndex, setCanvasIndex] = useState(0);
  
  const [globalScale, setGlobalScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const { addItem } = useCart();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('pause-scroll'));
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      window.dispatchEvent(new CustomEvent('resume-scroll'));
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    
    return () => {
      window.dispatchEvent(new CustomEvent('resume-scroll'));
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Handle cleanup of object URLs to avoid memory leaks
  useEffect(() => {
    if (!isOpen && isCustomWall && wallImage.startsWith('blob:')) {
      URL.revokeObjectURL(wallImage);
      setIsCustomWall(false);
      setWallImage(DEFAULT_CANVASES[0]);
      setGlobalScale(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cycleCanvas = () => {
    if (isCustomWall && wallImage.startsWith('blob:')) {
      URL.revokeObjectURL(wallImage);
    }
    const nextIdx = (canvasIndex + 1) % DEFAULT_CANVASES.length;
    setCanvasIndex(nextIdx);
    setWallImage(DEFAULT_CANVASES[nextIdx]);
    setIsCustomWall(false);
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const sizeId = currentProduct.sizes?.[0]?.id;
      const price = currentProduct.sizes?.[0]?.price || currentProduct.price || 0;
      await addItem(currentProduct.id, price, 1, sizeId);
      // Removed toast to prevent duplicate notifications
    } catch (err) {
      console.error(err);
      // Error toast is handled by addItem in CartContext
    } finally {
      setAddingToCart(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (isCustomWall && wallImage.startsWith('blob:')) {
      URL.revokeObjectURL(wallImage);
    }
    const url = URL.createObjectURL(file);
    setWallImage(url);
    setIsCustomWall(true);
  };

  const handleSave = async () => {
    if (!wallImage || !containerRef.current || !bgImageRef.current) return;
    
    const posterElement = document.querySelector('.main-poster-img') as HTMLImageElement;
    if (!posterElement) return;
    
    setSaving(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      // 1. Draw Background
      const bgImg = new window.Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { bgImg.onload = resolve; bgImg.onerror = reject; bgImg.src = wallImage; });
      
      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;
      ctx.drawImage(bgImg, 0, 0);

      // 2. Draw Poster (Calculate scaled position)
      const containerRect = containerRef.current.getBoundingClientRect();
      const posterRect = posterElement.getBoundingClientRect();

      const bgRenderedWidth = bgImageRef.current.width;
      const bgRenderedHeight = bgImageRef.current.height;

      // Map bounding client rect to canvas natural coordinates
      const scaleX = canvas.width / bgRenderedWidth;
      const scaleY = canvas.height / bgRenderedHeight;
      
      const offsetX = posterRect.left - containerRect.left;
      const offsetY = posterRect.top - containerRect.top;

      const pX = offsetX * scaleX;
      const pY = offsetY * scaleY;
      const pW = posterRect.width * scaleX;
      const pH = posterRect.height * scaleY;

      const pImg = new window.Image();
      pImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { pImg.onload = resolve; pImg.onerror = reject; pImg.src = posterUrl; });
      
      ctx.drawImage(pImg, pX, pY, pW, pH);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'jd-store-wall-preview.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Preview saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save the image. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-black/95 backdrop-blur-3xl"
        >
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-black/50 backdrop-blur-md border-b border-white/10 z-50 absolute top-0 w-full">
            <h3 className="font-display text-lg font-bold text-white tracking-wide truncate pr-4">
              {currentProduct.name}
            </h3>
            <button 
              onClick={handleBack}
              className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Left Panel: Info & Tools */}
          <div className="w-full md:w-[360px] lg:w-[420px] bg-[#0c0c0c] border-r border-white/5 flex flex-col z-40 md:relative absolute bottom-0 max-h-[45vh] md:max-h-none rounded-t-3xl md:rounded-none overflow-y-auto shadow-[0_-20px_40px_rgba(0,0,0,0.5)] md:shadow-none">
            
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-display text-xl font-bold text-white tracking-wide truncate">
                Wall Preview
              </h3>
              <button 
                onClick={handleBack}
                className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col space-y-8">
              
              <div className="space-y-2 text-center md:text-left mt-2 md:mt-0">
                <h4 className="font-display text-xl md:text-2xl font-bold text-white">{currentProduct.name}</h4>
                <p className="text-white/50 text-sm">See how it beautifully transforms your space.</p>
              </div>

              {/* Room Actions */}
              <div className="space-y-4">
                <h5 className="text-white/70 text-xs font-bold uppercase tracking-widest">Environment Canvas</h5>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={cycleCanvas}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-luxe-accent/50 active:scale-95 transition-all group"
                  >
                    <RefreshCw className="w-5 h-5 text-white/60 group-hover:text-luxe-accent transition-colors" />
                    <span className="text-[10px] font-medium text-white/80 text-center">Change Room</span>
                  </button>
                  <label className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-luxe-accent/50 active:scale-95 transition-all group cursor-pointer">
                    <Upload className="w-5 h-5 text-white/60 group-hover:text-luxe-accent transition-colors" />
                    <span className="text-[10px] font-medium text-white/80 text-center">Upload Wall</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button 
                    onClick={() => {
                      cycleCanvas();
                      setGlobalScale(Math.random() * (1.5 - 0.7) + 0.7);
                      toast.success('Auto Design applied!');
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-luxe-accent/10 border border-luxe-accent/30 hover:bg-luxe-accent/20 active:scale-95 transition-all group"
                  >
                    <Sparkles className="w-5 h-5 text-luxe-accent" />
                    <span className="text-[10px] font-bold text-luxe-accent text-center">Auto Design</span>
                  </button>
                </div>
              </div>

              {/* Buy Action */}
              <div className="mt-auto pt-6 border-t border-white/5 pb-6 md:pb-0">
                <button 
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-to-r from-luxe-accent to-[#d4b982] text-black font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-70 shadow-[0_0_20px_rgba(200,169,110,0.3)]"
                >
                  {addingToCart ? (
                    <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  Add to Cart
                </button>
              </div>

            </div>
          </div>

          {/* Main Viewport: The Canvas */}
          <div className="flex-1 relative overflow-hidden bg-black/90 flex items-center justify-center h-[55vh] md:h-auto" ref={containerRef}>
            
            {/* Background Wall Image */}
            <img 
              ref={bgImageRef}
              src={wallImage} 
              alt="Room Canvas" 
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-80"
            />

            {/* Premium Center Lighting / Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />

            {/* The Draggable Single Poster */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none pb-20 md:pb-0">
              <motion.img
                src={posterUrl}
                alt="Product Preview"
                drag
                dragConstraints={containerRef}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: globalScale, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  width: 'min(45vw, 350px)',
                  height: 'auto',
                  cursor: 'grab',
                  touchAction: 'none'
                }}
                whileDrag={{ cursor: 'grabbing', scale: globalScale * 1.05 }}
                className="main-poster-img pointer-events-auto border-8 border-white/10 filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.8)] rounded-[2px]"
                crossOrigin="anonymous"
              />
            </div>

            {/* Bottom Dock Controls */}
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-xl bg-black/50 border border-white/20 shadow-2xl z-30">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setGlobalScale(s => Math.max(0.4, s - 0.1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button 
                  onClick={() => setGlobalScale(s => Math.min(2.5, s + 0.1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
              
              <div className="w-px h-8 bg-white/20" />
              
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Save Photo</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
