'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, ZoomIn, ZoomOut, Sparkles, ShoppingCart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
// @ts-ignore
import Persp from 'perspective-transform';
import { toJpeg } from 'html-to-image';
import { detectWallBounds } from '@/lib/ml/wallDetector';
import { FRAME_STYLES, GALLERY_PRESETS, FrameStyle } from './VirtualTryOnConfig';

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
// ─── Wall Lighting Analyzer ───────────────────────────────────────────────────
// Draws uploaded image to offscreen canvas and compares left vs right brightness
async function detectWallLightingDirection(imgUrl: string): Promise<'left' | 'right' | 'center'> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 128, 64);
        
        // Left half
        const leftData = ctx.getImageData(0, 0, 64, 64).data;
        let leftB = 0;
        for (let i = 0; i < leftData.length; i += 4) {
          leftB += (leftData[i] * 299 + leftData[i + 1] * 587 + leftData[i + 2] * 114) / 1000;
        }
        leftB /= (64 * 64);

        // Right half
        const rightData = ctx.getImageData(64, 0, 64, 64).data;
        let rightB = 0;
        for (let i = 0; i < rightData.length; i += 4) {
          rightB += (rightData[i] * 299 + rightData[i + 1] * 587 + rightData[i + 2] * 114) / 1000;
        }
        rightB /= (64 * 64);

        if (leftB > rightB + 10) resolve('left');
        else if (rightB > leftB + 10) resolve('right');
        else resolve('center');
      } catch {
        resolve('center');
      }
    };
    img.onerror = () => resolve('center');
    img.src = imgUrl;
  });
}
export function VirtualTryOnModal({ isOpen, onClose, posterUrl, currentProduct }: VirtualTryOnModalProps) {
  const [customWallImage, setCustomWallImage] = useState<string | null>(null);
  const [prevRoomThemeUrl, setPrevRoomThemeUrl] = useState<string | null>(null);
  
  const [globalScale, setGlobalScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAutoDesigning, setIsAutoDesigning] = useState(false);
  const [lightSource, setLightSource] = useState<'left' | 'right' | 'center'>('center');
  
  // Perspective Warp State
  const [isPerspectiveMode, setIsPerspectiveMode] = useState(false);
  const [wallCorners, setWallCorners] = useState<{x: number, y: number}[] | null>(null);
  const [warpMatrix, setWarpMatrix] = useState<string>('none');
  
  // Live AR State
  const [isArMode, setIsArMode] = useState(false);
  const [arStream, setArStream] = useState<MediaStream | null>(null);
  
  const [galleryPosters, setGalleryPosters] = useState<RenderedPoster[]>([]);
  const [activePosterId, setActivePosterId] = useState<string | null>(null);

  const updatePoster = (id: string, updates: Partial<RenderedPoster>) => {
    setGalleryPosters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePoster = (id: string) => {
    setGalleryPosters(prev => prev.filter(p => p.id !== id));
    if (activePosterId === id) setActivePosterId(null);
  };
  
  const { addItem } = useCart();
  const supabase = createClient();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  // Perspective Warp Calculation
  useEffect(() => {
    if (!wallCorners || !containerRef.current) {
      setWarpMatrix('none');
      return;
    }
    const { width, height } = containerRef.current.getBoundingClientRect();
    const src = [0, 0, width, 0, width, height, 0, height];
    const dst = wallCorners.flatMap(c => [c.x, c.y]);
    try {
      const transform = Persp(src, dst);
      // transform.coeffs gives 3x3 homography [a,b,c, d,e,f, g,h,i]
      const [a, b, c, d, e, f, g, h, i] = transform.coeffs;
      
      // We map this to 4x4 column-major CSS matrix3d
      // m11=a, m12=d, m14=g
      // m21=b, m22=e, m24=h
      // m31=0, m32=0, m33=1, m34=0
      // m41=c, m42=f, m43=0, m44=i
      const matrix3d = `matrix3d(${a}, ${d}, 0, ${g}, ${b}, ${e}, 0, ${h}, 0, 0, 1, 0, ${c}, ${f}, 0, ${i})`;
      setWarpMatrix(matrix3d);
    } catch (e) {
      // In case the polygon is invalid
    }
  }, [wallCorners]);

  const togglePerspectiveMode = () => {
    if (isPerspectiveMode) {
      setIsPerspectiveMode(false);
      setWallCorners(null);
    } else {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setWallCorners([
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      ]);
      setIsPerspectiveMode(true);
    }
  };

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
      setActivePosterId(null);
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
    }
  }, [isOpen, customWallImage]);

  // Handle Custom Wall Upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Cleanup previous object url if exists
    if (customWallImage && customWallImage.startsWith('blob:')) {
      URL.revokeObjectURL(customWallImage);
    }
    
    const url = URL.createObjectURL(file);
    setCustomWallImage(url);
    setPrevRoomThemeUrl(customWallImage);
    setIsAutoDesigning(true);
    
    try {
      // Smart Lighting Detection
      const direction = await detectWallLightingDirection(url);
      setLightSource(direction);
      
      const wallBounds = await detectWallBounds(url);
      let centerX = 0, centerY = 0;
      let scaleMult = 1;

      if (wallBounds) {
        centerX = (wallBounds.x + wallBounds.width / 2) * 100 - 50;
        centerY = (wallBounds.y + wallBounds.height / 2) * 100 - 50;
        scaleMult = Math.min(1.5, Math.max(0.5, wallBounds.width * 2));
        toast.success('Wall boundary detected via Edge ML!');
        setIsPerspectiveMode(false);
        setWallCorners(null);
      }

      setGalleryPosters([{
        id: 'init-' + currentProduct.id,
        productId: currentProduct.id,
        productName: currentProduct.name,
        url: posterUrl,
        price: currentProduct.sizes?.[0]?.price || currentProduct.price || 0,
        sizeId: currentProduct.sizes?.[0]?.id,
        isHero: true,
        xPercent: centerX,
        yPercent: centerY,
        scaleFactor: 0.36 * scaleMult,
        rotation: 0,
        frame: FRAME_STYLES[0]
      }]);
    } catch (err) {
      toast.error("Failed to process wall image.");
    } finally {
      setIsAutoDesigning(false);
    }
    
    // Reset input
    e.target.value = '';
  }, [customWallImage, currentProduct, posterUrl]);

  const handleAutoDesign = async () => {
    setIsAutoDesigning(true);
    setPrevRoomThemeUrl(customWallImage);
    
    try {
      // 1. Choose Layout
      const layout = GALLERY_PRESETS[Math.floor(Math.random() * GALLERY_PRESETS.length)];
      const numSupporting = layout.posters.filter(p => !p.isHero).length;
      
      // 3. Fetch Posters
      let supportingProducts: any[] = [];
      if (numSupporting > 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*, sizes:poster_sizes(*), images:product_images(*)')
          .eq('product_type', 'poster')
          .eq('is_active', true)
          .neq('id', currentProduct.id)
          .limit(30);
          
        if (error) {
          console.error('Supabase fetch error:', error);
        }
          
        if (data && data.length > 0) {
          const shuffled = data.sort(() => 0.5 - Math.random());
          supportingProducts = shuffled.slice(0, numSupporting);
        }
      }

      // Edge ML Wall Detection
      let spreadX = 60, spreadY = 60, centerX = 0, centerY = 0;
      let scaleMult = 1;
      let activeBg = customWallImage;
      if (!activeBg && !isArMode) {
         toast.error("Please upload a wall first!");
         setIsAutoDesigning(false);
         return;
      }
      
      // If AR Mode, we skip detection or run detection on a snapshot?
      // For now, if no custom wall image, we assume AR or blank. We only run ML on an image.
      if (activeBg) {
        const wallBounds = await detectWallBounds(activeBg);
        if (wallBounds) {
          spreadX = wallBounds.width * 100 * 0.8;
          spreadY = wallBounds.height * 100 * 0.8;
          centerX = (wallBounds.x + wallBounds.width / 2) * 100 - 50;
          centerY = (wallBounds.y + wallBounds.height / 2) * 100 - 50;
          // Scale posters down slightly if wall is small
          scaleMult = Math.min(1.2, Math.max(0.4, wallBounds.width * 1.5));
          toast.success('Wall boundary detected via Edge ML!');
          
          // Reset perspective when ML bounds are found
          setIsPerspectiveMode(false);
          setWallCorners(null);
        } else {
          toast.error('AI could not detect a wall perfectly, using full canvas.');
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
            xPercent: centerX + (pos.xPercent * (spreadX / 60)),
            yPercent: centerY + (pos.yPercent * (spreadY / 60)),
            scaleFactor: baseHeroScale * pos.scaleFactor * scaleMult,
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
                xPercent: centerX + (pos.xPercent * (spreadX / 60)),
                yPercent: centerY + (pos.yPercent * (spreadY / 60)),
                scaleFactor: baseSuppScale * pos.scaleFactor * scaleMult,
                rotation: rotation,
                frame: frameStyle
              });
            }
          }
        }
      });
      
      setCustomWallImage(null);
      setGalleryPosters(newGallery);
      setGlobalScale(1);
      
      // Clear prev theme url after animation duration
      setTimeout(() => setPrevRoomThemeUrl(null), 300);
      setGalleryPosters(newGallery);
    } catch (err) {
      console.error(err);
      toast.error('Failed to auto-design layout.');
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
      const handles = document.getElementById('perspective-handles');
      if (handles) handles.style.display = 'none';

      const dataUrl = await toJpeg(containerRef.current, {
        quality: 0.9,
        backgroundColor: '#000',
        pixelRatio: 2 // for high-res saving
      });

      if (handles) handles.style.display = 'block';

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

  const handleShare = async () => {
    setSharing(true);
    try {
      const slug = Math.random().toString(36).substring(2, 8);
      const { error } = await supabase.from('saved_layouts').insert({
        slug,
        room_theme_url: customWallImage || '',
        light_source: lightSource,
        wall_corners: wallCorners ? JSON.parse(JSON.stringify(wallCorners)) : null,
        posters: JSON.parse(JSON.stringify(galleryPosters))
      });
      if (error) {
        console.error('Supabase error:', error);
        toast.error('Could not save to database. Have you run the 016_gallery_layouts.sql migration?');
        return;
      }
      
      const shareUrl = `${window.location.origin}/gallery/${slug}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Gallery link copied to clipboard!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate link.');
    } finally {
      setSharing(false);
    }
  };

  const handleBack = () => onClose();

  const toggleArMode = async () => {
    if (isArMode) {
      setIsArMode(false);
      if (arStream) {
        arStream.getTracks().forEach(t => t.stop());
        setArStream(null);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setArStream(stream);
        setIsArMode(true);
        // Force light source to center for AR
        setLightSource('center');
      } catch (err) {
        toast.error("Camera access denied or unavailable on this device.");
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-black"
        >
          {/* Background Layer (Full Screen) */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <AnimatePresence mode="popLayout">
              {isArMode && (
                <motion.video
                  key="ar-video"
                  ref={el => {
                    if (el && arStream && el.srcObject !== arStream) {
                      el.srcObject = arStream;
                      el.play().catch(console.error);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {!isArMode && prevRoomThemeUrl && (
                <motion.img 
                  key={prevRoomThemeUrl}
                  src={prevRoomThemeUrl} 
                  className="absolute inset-0 w-full h-full object-cover opacity-0"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              )}
              {!isArMode && customWallImage && (
                <motion.img 
                  key={customWallImage}
                  src={customWallImage} 
                  alt="Room" 
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  crossOrigin="anonymous"
                />
              )}
            </AnimatePresence>
          </div>
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-50 absolute top-0 w-full">
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
          <div className="w-full md:w-[360px] lg:w-[420px] bg-black/80 md:bg-[#0c0c0c] border-r border-white/5 flex flex-col z-40 order-2 md:order-1 backdrop-blur-2xl md:backdrop-blur-none max-h-[45vh] md:max-h-none rounded-t-3xl md:rounded-none overflow-y-auto shadow-[0_-20px_40px_rgba(0,0,0,0.5)] md:shadow-none">
            
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
                    <span className="text-xs font-bold text-luxe-accent">
                      {isAutoDesigning ? 'Detecting AI...' : 'Auto Design'}
                    </span>
                  </button>
                  <button 
                    onClick={toggleArMode}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all group active:scale-95",
                      isArMode ? "bg-white/20 border-white" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                    )}
                  >
                    <svg className={cn("w-5 h-5 transition-colors", isArMode ? "text-white" : "text-white/60 group-hover:text-white")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className={cn("text-xs font-medium", isArMode ? "text-white font-bold" : "text-white/80")}>Live AR</span>
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 pb-6 md:pb-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Download className="w-4 h-4" />}
                    Save
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={sharing}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {sharing ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Share2 className="w-4 h-4" />}
                    Share
                  </button>
                </div>

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
          <div 
            className="flex-1 relative z-10 flex items-center justify-center order-1 md:order-2 min-h-0" 
            ref={containerRef}
            onPointerDown={() => setActivePosterId(null)}
          >

            {/* Render Perspective Wrappers & Handles */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none pb-20 md:pb-0" style={{ perspective: isPerspectiveMode ? undefined : '1000px' }}>
              <motion.div 
                animate={{ scale: globalScale }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full h-full flex items-center justify-center pointer-events-none"
                style={{
                  transform: warpMatrix !== 'none' ? warpMatrix : undefined,
                  transformOrigin: '0 0',
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              >
                <AnimatePresence>
                  {galleryPosters.map((poster, i) => (
                    <motion.div
                      key={poster.id}
                      drag
                      dragConstraints={containerRef}
                      dragMomentum={false}
                      dragElastic={0.1}
                      onPointerDown={() => setActivePosterId(poster.id)}
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
                        poster.frame.css
                      )}
                      style={{
                        width: `${poster.scaleFactor * 100}%`,
                        maxWidth: poster.isHero ? '400px' : '300px',
                        aspectRatio: '3/4',
                        backgroundColor: poster.frame.css.includes('bg-') ? undefined : '#1a1a1a', // fallback
                        zIndex: activePosterId === poster.id ? 50 : (poster.isHero ? 20 : 10),
                        cursor: 'grab',
                        boxShadow: poster.isHero 
                          ? (lightSource === 'left' ? '20px 20px 45px rgba(0,0,0,0.8)' : lightSource === 'right' ? '-20px 20px 45px rgba(0,0,0,0.8)' : '0 20px 45px rgba(0,0,0,0.8)') 
                          : (lightSource === 'left' ? '12px 12px 30px rgba(0,0,0,0.6)' : lightSource === 'right' ? '-12px 12px 30px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.6)')
                      }}
                      whileDrag={{ cursor: 'grabbing', scale: 1.02, zIndex: 60 }}
                    >
                      <img 
                        src={poster.url} 
                        alt={poster.productName} 
                        className="w-full h-full object-cover pointer-events-none"
                        crossOrigin="anonymous"
                      />
                      
                      {/* Active Toolbar Overlay */}
                      <AnimatePresence>
                        {activePosterId === poster.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 pointer-events-auto"
                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when using toolbar
                          >
                            <div className="flex items-center gap-1.5">
                              {FRAME_STYLES.map(fs => (
                                <button
                                  key={fs.name}
                                  title={fs.name}
                                  onClick={() => updatePoster(poster.id, { frame: fs })}
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all",
                                    poster.frame.name === fs.name ? "border-[#c8a96e] scale-110" : "border-white/20 hover:border-white/50"
                                  )}
                                  style={{ background: fs.css.includes('bg-white') ? '#fff' : (fs.css.includes('bg-zinc-800') ? '#27272a' : (fs.css.includes('bg-amber-900') ? '#78350f' : (fs.css.includes('bg-neutral-900') ? '#171717' : 'transparent'))) }}
                                />
                              ))}
                            </div>
                            
                            <div className="w-px h-5 bg-white/20 mx-1" />
                            
                            {/* Scale Slider */}
                            <input 
                              type="range" 
                              min="0.1" max="0.6" step="0.01" 
                              value={poster.scaleFactor}
                              onChange={(e) => updatePoster(poster.id, { scaleFactor: parseFloat(e.target.value) })}
                              className="w-20 accent-[#c8a96e]"
                              title="Resize"
                            />
                            
                            {/* Rotate Slider */}
                            <input 
                              type="range" 
                              min="-20" max="20" step="1" 
                              value={poster.rotation}
                              onChange={(e) => updatePoster(poster.id, { rotation: parseFloat(e.target.value) })}
                              className="w-20 accent-[#c8a96e]"
                              title="Rotate"
                            />

                            <div className="w-px h-5 bg-white/20 mx-1" />

                            <button 
                              onClick={() => removePoster(poster.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-all"
                              title="Remove poster"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {/* Perspective Mode 4-Corner Handles */}
              {isPerspectiveMode && wallCorners && (
                <div id="perspective-handles" className="absolute inset-0 z-[100] pointer-events-none">
                  {wallCorners.map((corner, idx) => (
                    <motion.div
                      key={idx}
                      drag
                      dragMomentum={false}
                      dragElastic={0}
                      onDrag={(e, info) => {
                        setWallCorners(prev => {
                          if (!prev) return prev;
                          const next = [...prev];
                          // Adjust coordinates based on pan offset
                          next[idx] = { x: next[idx].x + info.delta.x, y: next[idx].y + info.delta.y };
                          return next;
                        });
                      }}
                      className="absolute w-8 h-8 -ml-4 -mt-4 bg-white/10 border-2 border-white rounded-full flex items-center justify-center cursor-crosshair pointer-events-auto backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      style={{ x: corner.x, y: corner.y }}
                      whileDrag={{ scale: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </motion.div>
                  ))}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-full text-sm border border-white/20 pointer-events-none">
                    Drag the corners to match your wall's perspective
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Dock */}
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-xl bg-black/50 border border-white/20 shadow-2xl z-[110]">
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
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button 
                  onClick={togglePerspectiveMode}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isPerspectiveMode ? "text-black bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "text-white/80 hover:text-white hover:bg-white/20 active:scale-95"
                  )}
                  title="3D Perspective Warp"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7l8-4 8 4-8 4-8-4z" />
                    <path d="M3 17l8 4 8-4M3 12l8 4 8-4" />
                  </svg>
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
