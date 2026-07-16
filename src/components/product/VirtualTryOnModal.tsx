'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, ZoomIn, ZoomOut, Sparkles, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ROOM_THEMES, FRAME_STYLES, GALLERY_PRESETS, RoomTheme, FrameStyle } from './VirtualTryOnConfig';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
  currentProduct: Product;
}

interface RenderedPoster {
  id: string;
  productId: string;
  productName: string;
  url: string;
  price: number;
  sizeId: string | undefined;
  isHero: boolean;
  xPercent: number;
  yPercent: number;
  scaleFactor: number;
  rotation: number;
  frame: FrameStyle;
}

export function VirtualTryOnModal({ isOpen, onClose, posterUrl, currentProduct }: VirtualTryOnModalProps) {
  const [roomTheme, setRoomTheme] = useState<RoomTheme>(ROOM_THEMES[0]);
  const [customWallImage, setCustomWallImage] = useState<string | null>(null);
  const [prevRoomThemeUrl, setPrevRoomThemeUrl] = useState<string | null>(null);
  
  const [globalScale, setGlobalScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAutoDesigning, setIsAutoDesigning] = useState(false);
  
  const [galleryPosters, setGalleryPosters] = useState<RenderedPoster[]>([]);
  
  const { addItem } = useCart();
  const supabase = createClient();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  // Initialize with single hero on open
  useEffect(() => {
    if (isOpen) {
      setGalleryPosters([{
        id: 'init-' + currentProduct.id,
        productId: currentProduct.id,
        productName: currentProduct.name,
        url: posterUrl,
        price: currentProduct.sizes?.[0]?.price || currentProduct.price || 0,
        sizeId: currentProduct.sizes?.[0]?.id,
        isHero: true,
        xPercent: 0,
        yPercent: 0,
        scaleFactor: 0.36,
        rotation: 0,
        frame: FRAME_STYLES[0]
      }]);
      setGlobalScale(1);
    }
  }, [isOpen, currentProduct, posterUrl]);

  // Handle scroll lock
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

  useEffect(() => {
    if (!isOpen && customWallImage && customWallImage.startsWith('blob:')) {
      URL.revokeObjectURL(customWallImage);
      setCustomWallImage(null);
      setRoomTheme(ROOM_THEMES[0]);
    }
  }, [isOpen, customWallImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (customWallImage && customWallImage.startsWith('blob:')) {
      URL.revokeObjectURL(customWallImage);
    }
    const url = URL.createObjectURL(file);
    setCustomWallImage(url);
  };

  const handleAutoDesign = async () => {
    setIsAutoDesigning(true);
    setPrevRoomThemeUrl(customWallImage || roomTheme.url);
    
    try {
      // 1. Choose Room Theme
      const nextTheme = ROOM_THEMES[Math.floor(Math.random() * ROOM_THEMES.length)];
      
      // 2. Choose Layout
      const layout = GALLERY_PRESETS[Math.floor(Math.random() * GALLERY_PRESETS.length)];
      const numSupporting = layout.posters.filter(p => !p.isHero).length;
      
      // 3. Fetch Posters
      let supportingProducts: any[] = [];
      if (numSupporting > 0) {
        const { data } = await supabase
          .from('products')
          .select('*, sizes:product_sizes(*), images:product_images(*)')
          .eq('product_type', 'poster')
          .eq('is_active', true)
          .neq('id', currentProduct.id)
          .limit(30);
          
        if (data && data.length > 0) {
          const shuffled = data.sort(() => 0.5 - Math.random());
          supportingProducts = shuffled.slice(0, numSupporting);
        }
      }

      // 4. Build Layout
      const newGallery: RenderedPoster[] = [];
      const frameStyle = FRAME_STYLES[Math.floor(Math.random() * FRAME_STYLES.length)];
      
      // Base scaling variables
      const baseHeroScale = Math.random() * (0.40 - 0.34) + 0.34;
      const baseSuppScale = Math.random() * (0.21 - 0.17) + 0.17;
      
      layout.posters.forEach((pos, idx) => {
        const rotation = (Math.random() * 8) - 4;
        if (pos.isHero) {
          newGallery.push({
            id: 'hero-' + Date.now(),
            productId: currentProduct.id,
            productName: currentProduct.name,
            url: posterUrl,
            price: currentProduct.sizes?.[0]?.price || currentProduct.price || 0,
            sizeId: currentProduct.sizes?.[0]?.id,
            isHero: true,
            xPercent: pos.xPercent,
            yPercent: pos.yPercent,
            scaleFactor: baseHeroScale * pos.scaleFactor,
            rotation: rotation,
            frame: frameStyle
          });
        } else {
          const supp = supportingProducts.pop();
          if (supp) {
            const imgUrl = supp.images?.find((img: any) => img.is_primary)?.url || supp.images?.[0]?.url;
            if (imgUrl) {
              newGallery.push({
                id: 'supp-' + idx + '-' + Date.now(),
                productId: supp.id,
                productName: supp.name,
                url: imgUrl,
                price: supp.sizes?.[0]?.price || supp.price || 0,
                sizeId: supp.sizes?.[0]?.id,
                isHero: false,
                xPercent: pos.xPercent,
                yPercent: pos.yPercent,
                scaleFactor: baseSuppScale * pos.scaleFactor,
                rotation: rotation,
                frame: frameStyle
              });
            }
          }
        }
      });
      
      setRoomTheme(nextTheme);
      setCustomWallImage(null);
      setGalleryPosters(newGallery);
      setGlobalScale(1);
      
      // Clear prev theme url after animation duration
      setTimeout(() => setPrevRoomThemeUrl(null), 300);
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate auto design');
    } finally {
      setIsAutoDesigning(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const uniqueIds = new Set<string>();
      let addedCount = 0;
      
      const promises = galleryPosters.map(async (p) => {
        if (!uniqueIds.has(p.productId)) {
          uniqueIds.add(p.productId);
          await addItem(p.productId, p.price, 1, p.sizeId, true); // silent
          addedCount++;
        }
      });
      
      await Promise.all(promises);
      toast.success(`Added ${addedCount} poster${addedCount > 1 ? 's' : ''} to your cart.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSave = async () => {
    if (!containerRef.current) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create context');
      
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      const bgImg = new window.Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { 
        bgImg.onload = resolve; 
        bgImg.onerror = reject; 
        bgImg.src = customWallImage || roomTheme.url; 
      });
      
      const bgAspect = bgImg.width / bgImg.height;
      const cvAspect = rect.width / rect.height;
      let drawW = rect.width;
      let drawH = rect.height;
      let drawX = 0;
      let drawY = 0;
      
      if (bgAspect > cvAspect) {
        drawW = rect.height * bgAspect;
        drawX = (rect.width - drawW) / 2;
      } else {
        drawH = rect.width / bgAspect;
        drawY = (rect.height - drawH) / 2;
      }
      
      ctx.globalAlpha = 0.8;
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
      ctx.globalAlpha = 1.0;
      
      const posterElements = document.querySelectorAll('.gallery-poster-img');
      for (const el of Array.from(posterElements)) {
        const htmlEl = el as HTMLElement;
        const pRect = htmlEl.getBoundingClientRect();
        
        const pImg = new window.Image();
        pImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          pImg.onload = resolve;
          pImg.onerror = reject;
          const innerImg = htmlEl.querySelector('img');
          pImg.src = innerImg?.src || '';
        });

        const pX = pRect.left - rect.left;
        const pY = pRect.top - rect.top;
        const pW = pRect.width;
        const pH = pRect.height;
        
        ctx.save();
        const transform = window.getComputedStyle(htmlEl).transform;
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const a = values[0];
          const b = values[1];
          const angle = Math.round(Math.atan2(parseFloat(b), parseFloat(a)) * (180/Math.PI));
          ctx.translate(pX + pW/2, pY + pH/2);
          ctx.rotate(angle * Math.PI / 180);
          ctx.translate(-(pX + pW/2), -(pY + pH/2));
        }

        ctx.fillStyle = htmlEl.style.backgroundColor || '#000';
        ctx.fillRect(pX, pY, pW, pH);

        const bw = parseInt(htmlEl.style.borderWidth) || 0;
        ctx.drawImage(pImg, pX + bw, pY + bw, pW - bw*2, pH - bw*2);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'jd-store-gallery-preview.jpg';
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

  const handleBack = () => onClose();

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

          {/* Left Panel */}
          <div className="w-full md:w-[360px] lg:w-[420px] bg-[#0c0c0c] border-r border-white/5 flex flex-col z-40 md:relative absolute bottom-0 max-h-[45vh] md:max-h-none rounded-t-3xl md:rounded-none overflow-y-auto shadow-[0_-20px_40px_rgba(0,0,0,0.5)] md:shadow-none">
            
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

              <div className="space-y-4">
                <h5 className="text-white/70 text-xs font-bold uppercase tracking-widest">Environment Canvas</h5>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-luxe-accent/50 active:scale-95 transition-all group cursor-pointer">
                    <Upload className="w-5 h-5 text-white/60 group-hover:text-luxe-accent transition-colors" />
                    <span className="text-xs font-medium text-white/80">Upload Wall</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button 
                    onClick={handleAutoDesign}
                    disabled={isAutoDesigning}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-luxe-accent/10 border border-luxe-accent/30 hover:bg-luxe-accent/20 active:scale-95 transition-all group disabled:opacity-50"
                  >
                    {isAutoDesigning ? (
                      <div className="w-5 h-5 rounded-full border-2 border-luxe-accent/30 border-t-luxe-accent animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-luxe-accent" />
                    )}
                    <span className="text-xs font-bold text-luxe-accent">Auto Design</span>
                  </button>
                </div>
              </div>

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

          {/* Main Viewport */}
          <div className="flex-1 relative overflow-hidden bg-black/90 flex items-center justify-center h-[55vh] md:h-auto" ref={containerRef}>
            
            <AnimatePresence mode="popLayout">
              {prevRoomThemeUrl && (
                <motion.img
                  key="prev-bg"
                  src={prevRoomThemeUrl}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              )}
            </AnimatePresence>
            <motion.img 
              key={customWallImage || roomTheme.url}
              src={customWallImage || roomTheme.url} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />

            <div className={cn("absolute inset-0 pointer-events-none bg-gradient-to-t", roomTheme.lighting)} />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />

            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none pb-20 md:pb-0">
              <motion.div
                animate={{ scale: globalScale }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <AnimatePresence>
                  {galleryPosters.map((poster, i) => (
                    <motion.div
                      key={poster.id}
                      initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%', top: `calc(50% + ${poster.yPercent}%)`, left: `calc(50% + ${poster.xPercent}%)` }}
                      animate={{ 
                        opacity: 1, 
                        y: '-50%', 
                        scale: 1,
                        x: '-50%',
                        top: `calc(50% + ${poster.yPercent}%)`,
                        left: `calc(50% + ${poster.xPercent}%)`,
                        rotate: poster.rotation
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 150, 
                        damping: 20,
                        delay: i * 0.08 
                      }}
                      className={cn(
                        "gallery-poster-img absolute pointer-events-auto rounded-[2px]",
                        poster.frame.css,
                        poster.isHero ? 'shadow-[0_20px_45px_rgba(0,0,0,0.8)] z-20' : 'shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-10'
                      )}
                      style={{
                        width: `${poster.scaleFactor * 100}vw`,
                        maxWidth: poster.isHero ? '400px' : '300px',
                        aspectRatio: '3/4',
                        backgroundColor: poster.frame.css.includes('bg-') ? undefined : '#1a1a1a' // fallback
                      }}
                    >
                      <img 
                        src={poster.url} 
                        alt={poster.productName} 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Bottom Dock */}
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
