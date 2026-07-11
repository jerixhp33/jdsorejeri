'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, ZoomIn, ZoomOut, Image as ImageIcon, Sparkles, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
  currentProduct: Product;
}

interface CollagePoster {
  id: string; // unique instance id
  productId: string;
  url: string;
  initialX: number; // 0-100%
  initialY: number; // 0-100%
  widthVw: number; // width in viewport width units
  product: Product;
}

// Layouts based on viewport widths (vw) and viewport heights (vh) percentages
// This guarantees posters don't overlap regardless of the original image resolution.
const LAYOUTS = [
  // 1. Dense Grid (3x4)
  [
    { x: 25, y: 20, width: 22 }, { x: 50, y: 20, width: 22 }, { x: 75, y: 20, width: 22 },
    { x: 25, y: 40, width: 22 }, { x: 50, y: 40, width: 22 }, { x: 75, y: 40, width: 22 },
    { x: 25, y: 60, width: 22 }, { x: 50, y: 60, width: 22 }, { x: 75, y: 60, width: 22 },
    { x: 25, y: 80, width: 22 }, { x: 50, y: 80, width: 22 }, { x: 75, y: 80, width: 22 },
  ],
  // 2. Cross / Diamond
  [
    { x: 50, y: 50, width: 28 }, // Center
    { x: 50, y: 25, width: 22 }, // Top
    { x: 50, y: 75, width: 22 }, // Bottom
    { x: 20, y: 50, width: 22 }, // Left
    { x: 80, y: 50, width: 22 }, // Right
    { x: 25, y: 28, width: 18 }, // Top Left
    { x: 75, y: 28, width: 18 }, // Top Right
    { x: 25, y: 72, width: 18 }, // Bottom Left
    { x: 75, y: 72, width: 18 }, // Bottom Right
  ],
  // 3. Staggered Gallery Wall
  [
    { x: 45, y: 45, width: 32 }, // Main Left
    { x: 75, y: 35, width: 22 }, // Top Right
    { x: 75, y: 60, width: 24 }, // Mid Right
    { x: 40, y: 72, width: 18 }, // Bottom Left
    { x: 60, y: 80, width: 20 }, // Bottom Center
  ],
  // 4. Clean 2x2 Square Grid
  [
    { x: 35, y: 35, width: 25 },
    { x: 65, y: 35, width: 25 },
    { x: 35, y: 65, width: 25 },
    { x: 65, y: 65, width: 25 },
  ],
  // 5. The Hero (One huge center, 4 small corners)
  [
    { x: 50, y: 50, width: 40 }, // Massive Center
    { x: 20, y: 20, width: 15 }, // TL
    { x: 80, y: 20, width: 15 }, // TR
    { x: 20, y: 80, width: 15 }, // BL
    { x: 80, y: 80, width: 15 }, // BR
  ],
  // 6. Vertical Cascade
  [
    { x: 50, y: 20, width: 35 },
    { x: 50, y: 50, width: 35 },
    { x: 50, y: 80, width: 35 },
  ]
];

export function VirtualTryOnModal({ isOpen, onClose, posterUrl, currentProduct }: VirtualTryOnModalProps) {
  const [wallImage, setWallImage] = useState<string | null>(null);
  const [globalScale, setGlobalScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const [posterLibrary, setPosterLibrary] = useState<Product[]>([]);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);
  
  const [posterGrid, setPosterGrid] = useState<CollagePoster[]>([]);
  
  const { addItem } = useCart();
  const supabase = createClient();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPosterGrid([{
        id: 'main-' + Date.now(),
        productId: currentProduct.id,
        url: posterUrl,
        initialX: 50,
        initialY: 50,
        widthVw: 35, // default single poster size
        product: currentProduct
      }]);
    }
  }, [isOpen, posterUrl, currentProduct]);

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
    if (!isOpen) {
      if (wallImage) URL.revokeObjectURL(wallImage);
      setWallImage(null);
      setGlobalScale(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchLibrary = async () => {
    if (posterLibrary.length > 0) return posterLibrary;
    setIsFetchingLibrary(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_images(id, url, is_primary, alt_text)`)
        .eq('product_type', 'poster')
        .eq('is_active', true);
        
      if (error) throw error;
      
      const formatted = data.map((p: any) => ({
        ...p,
        images: p.product_images
      }));
      setPosterLibrary(formatted);
      return formatted;
    } catch (err) {
      console.error('Failed to fetch posters for collage', err);
      toast.error('Could not load extra posters for collage.');
      return [];
    } finally {
      setIsFetchingLibrary(false);
    }
  };

  const handleAutoDesign = async () => {
    let lib = posterLibrary;
    if (lib.length === 0) {
      lib = await fetchLibrary();
    }
    
    if (lib.length < 3) {
      toast.error('Not enough posters in the store to create a collage.');
      return;
    }

    const layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    const shuffled = [...lib].sort(() => 0.5 - Math.random());
    const otherPosters = shuffled.filter(p => p.id !== currentProduct.id);
    
    const newCollage: CollagePoster[] = [];
    
    for (let i = 0; i < layout.length; i++) {
      let productForSpot;
      if (i === 0) {
        productForSpot = currentProduct;
      } else {
        productForSpot = otherPosters[(i - 1) % otherPosters.length];
      }
      
      const imgUrl = productForSpot?.images?.find((img: any) => img.is_primary)?.url || productForSpot?.images?.[0]?.url;
      if (!imgUrl) continue;

      newCollage.push({
        id: `collage-${i}-${Date.now()}`,
        productId: productForSpot.id,
        url: imgUrl,
        initialX: layout[i].x,
        initialY: layout[i].y,
        widthVw: layout[i].width,
        product: productForSpot
      });
    }

    setPosterGrid(newCollage);
    toast.success('Generated a new wall design!');
  };

  const handleAddAllToCart = async () => {
    setAddingToCart(true);
    try {
      let addedCount = 0;
      const uniqueProducts = Array.from(new Set(posterGrid.map(p => p.productId)))
        .map(id => posterGrid.find(p => p.productId === id)!.product);
        
      for (const prod of uniqueProducts) {
        const sizeId = prod.sizes?.[0]?.id;
        const price = prod.sizes?.[0]?.price || prod.price || 0;
        await addItem(prod.id, price, 1, sizeId);
        addedCount++;
      }
      toast.success(`Added ${addedCount} posters to your cart!`);
    } catch (err) {
      toast.error('Failed to add some items to cart.');
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
    const url = URL.createObjectURL(file);
    setWallImage(url);
  };

  const handleSave = async () => {
    if (!wallImage || !containerRef.current || !bgImageRef.current) return;
    
    const posterElements = document.querySelectorAll('.collage-poster-img') as NodeListOf<HTMLImageElement>;
    if (posterElements.length === 0) return;
    
    setSaving(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { bgImg.onload = resolve; bgImg.onerror = reject; bgImg.src = wallImage; });

      canvas.width = bgImg.width;
      canvas.height = bgImg.height;
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const containerRect = containerRef.current.getBoundingClientRect();
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

      for (let i = 0; i < posterElements.length; i++) {
        const el = posterElements[i];
        const posterRect = el.getBoundingClientRect();
        
        const posterImg = new Image();
        posterImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => { posterImg.onload = resolve; posterImg.onerror = reject; posterImg.src = el.src; });

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
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = 'jd-store-wall-design.jpg';
      link.href = dataUrl;
      link.click();
      
      toast.success('Design saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a] backdrop-blur-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 z-20 bg-black/40 backdrop-blur-xl">
            <h3 className="font-display text-xl text-white font-bold tracking-wide">
              {posterGrid.length > 1 ? 'Wall Design Generator' : 'Virtual Try-On'}
            </h3>
            <div className="flex items-center gap-4">
              {posterGrid.length > 1 && (
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingToCart}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {addingToCart ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  Buy Collection
                </button>
              )}
              <button 
                onClick={handleBack}
                className="px-5 py-2.5 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md text-white font-semibold text-sm hover:bg-white/20 active:scale-95 transition-all border border-white/20 shadow-lg"
              >
                Back
              </button>
            </div>
          </div>

          {/* Main Viewport */}
          <div className="flex-1 relative overflow-hidden bg-black/20" ref={containerRef}>
            {!wallImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-full bg-luxe-accent/10 flex items-center justify-center mb-8 border border-luxe-accent/20 shadow-[0_0_40px_rgba(200,169,110,0.1)]"
                >
                  <ImageIcon className="w-10 h-10 text-luxe-accent" />
                </motion.div>
                <h4 className="font-display text-3xl font-bold text-white mb-3">Upload your wall</h4>
                <p className="text-white/50 text-base mb-10 max-w-sm leading-relaxed">
                  Take a photo of your room to see exactly how these posters will look on your wall.
                </p>
                <label className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-luxe-accent to-[#d4b982] text-black font-bold text-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-xl">
                  <Upload className="w-5 h-5" />
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
                {/* Background Wall */}
                <img 
                  ref={bgImageRef}
                  src={wallImage} 
                  alt="Your wall" 
                  className="w-full h-full object-cover md:object-contain pointer-events-none select-none brightness-90"
                />

                {/* Floating "Change Photo" Button */}
                <label className="absolute top-6 right-6 px-5 py-2.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 active:scale-95 transition-all cursor-pointer z-20 shadow-lg">
                  Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Draggable Posters Collage */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {posterGrid.map((poster, index) => (
                    <motion.img
                      key={poster.id}
                      src={poster.url}
                      alt={`Poster ${index}`}
                      drag
                      dragConstraints={containerRef}
                      dragElastic={0}
                      dragMomentum={false}
                      initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
                      animate={{ scale: globalScale, opacity: 1, x: '-50%', y: '-50%' }}
                      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                      style={{
                        position: 'absolute',
                        top: `${poster.initialY}%`,
                        left: `${poster.initialX}%`,
                        width: `${poster.widthVw}vw`,
                        height: 'auto',
                        cursor: 'grab',
                        touchAction: 'none',
                        transformOrigin: 'center center'
                      }}
                      whileDrag={{ cursor: 'grabbing', scale: globalScale * 1.05 }}
                      className="collage-poster-img pointer-events-auto border-4 border-white/10 bg-white/5 filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
                      crossOrigin="anonymous"
                    />
                  ))}
                </div>

                {/* Footer Dock */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-between w-[90%] max-w-md px-4 py-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl z-30">
                  
                  {/* Left: Auto Design */}
                  <button 
                    onClick={handleAutoDesign}
                    disabled={isFetchingLibrary}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-luxe-accent/20 to-transparent border border-luxe-accent/30 text-luxe-accent text-sm font-bold hover:bg-luxe-accent/30 active:scale-95 transition-all"
                  >
                    {isFetchingLibrary ? (
                      <div className="w-4 h-4 rounded-full border-2 border-luxe-accent/20 border-t-luxe-accent animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Auto Design
                  </button>

                  {/* Center: Zoom Controls */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                    <button 
                      onClick={() => setGlobalScale(s => Math.max(0.3, s - 0.1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setGlobalScale(s => Math.min(2.5, s + 0.1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Right: Save */}
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Save
                  </button>

                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
