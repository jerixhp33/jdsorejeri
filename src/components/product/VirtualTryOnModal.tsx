'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, ZoomIn, ZoomOut, Image as ImageIcon, Sparkles, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';

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
  baseScale: number;
  product: Product;
}

const LAYOUTS = [
  // 1. Cross / Diamond
  [
    { x: 50, y: 50, scale: 0.45 }, // Center
    { x: 50, y: 20, scale: 0.35 }, // Top
    { x: 50, y: 80, scale: 0.35 }, // Bottom
    { x: 20, y: 50, scale: 0.35 }, // Left
    { x: 80, y: 50, scale: 0.35 }, // Right
    { x: 25, y: 25, scale: 0.25 }, // Top Left
    { x: 75, y: 25, scale: 0.25 }, // Top Right
    { x: 25, y: 75, scale: 0.25 }, // Bottom Left
    { x: 75, y: 75, scale: 0.25 }, // Bottom Right
  ],
  // 2. 3x3 Grid
  [
    { x: 25, y: 25, scale: 0.3 }, { x: 50, y: 25, scale: 0.3 }, { x: 75, y: 25, scale: 0.3 },
    { x: 25, y: 50, scale: 0.3 }, { x: 50, y: 50, scale: 0.3 }, { x: 75, y: 50, scale: 0.3 },
    { x: 25, y: 75, scale: 0.3 }, { x: 50, y: 75, scale: 0.3 }, { x: 75, y: 75, scale: 0.3 },
  ],
  // 3. Asymmetrical Gallery
  [
    { x: 30, y: 40, scale: 0.5 }, // Large left
    { x: 70, y: 30, scale: 0.3 }, // Small top right
    { x: 70, y: 65, scale: 0.35 }, // Med bottom right
    { x: 45, y: 75, scale: 0.25 }, // Small bottom
    { x: 20, y: 70, scale: 0.25 }, // Small bottom left
  ]
];

export function VirtualTryOnModal({ isOpen, onClose, posterUrl, currentProduct }: VirtualTryOnModalProps) {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [globalScale, setGlobalScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Library of all posters for the collage
  const [posterLibrary, setPosterLibrary] = useState<Product[]>([]);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);
  
  // Currently displayed posters
  const [posters, setPosters] = useState<CollagePoster[]>([]);
  
  const { addItem } = useCart();
  const supabase = createClient();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);

  // Initialize with single poster
  useEffect(() => {
    if (isOpen) {
      setPosters([{
        id: 'main-' + Date.now(),
        productId: currentProduct.id,
        url: posterUrl,
        initialX: 50,
        initialY: 40,
        baseScale: 0.5,
        product: currentProduct
      }]);
    }
  }, [isOpen, posterUrl, currentProduct]);

  // Clear bg image on close
  useEffect(() => {
    if (!isOpen) {
      if (bgImage) URL.revokeObjectURL(bgImage);
      setBgImage(null);
      setGlobalScale(1);
    }
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

    // Pick a random layout
    const layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    
    // Shuffle the library
    const shuffled = [...lib].sort(() => 0.5 - Math.random());
    
    // Ensure the current product is in the layout (put it in the first spot, usually center)
    const otherPosters = shuffled.filter(p => p.id !== currentProduct.id);
    
    const newCollage: CollagePoster[] = [];
    
    for (let i = 0; i < layout.length; i++) {
      let productForSpot;
      if (i === 0) {
        productForSpot = currentProduct;
      } else {
        productForSpot = otherPosters[(i - 1) % otherPosters.length];
      }
      
      const imgUrl = productForSpot.images?.find(i => i.is_primary)?.url || productForSpot.images?.[0]?.url;
      if (!imgUrl) continue;

      newCollage.push({
        id: `collage-${i}-${Date.now()}`,
        productId: productForSpot.id,
        url: imgUrl,
        initialX: layout[i].x,
        initialY: layout[i].y,
        baseScale: layout[i].scale,
        product: productForSpot
      });
    }

    setPosters(newCollage);
    toast.success('Generated a new wall design!');
  };

  const handleAddAllToCart = async () => {
    setAddingToCart(true);
    try {
      let addedCount = 0;
      // Use a Set to avoid adding duplicates if the collage repeats a poster (it shouldn't, but just in case)
      const uniqueProducts = Array.from(new Set(posters.map(p => p.productId)))
        .map(id => posters.find(p => p.productId === id)!.product);
        
      for (const prod of uniqueProducts) {
        // Find default size (usually A4)
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
    setBgImage(url);
  };

  const handleSave = async () => {
    if (!bgImage || !containerRef.current || !bgImageRef.current) return;
    
    const posterElements = document.querySelectorAll('.collage-poster-img') as NodeListOf<HTMLImageElement>;
    if (posterElements.length === 0) return;
    
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

      // Draw each poster
      for (let i = 0; i < posterElements.length; i++) {
        const el = posterElements[i];
        const posterRect = el.getBoundingClientRect();
        
        const posterImg = new Image();
        posterImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          posterImg.onload = resolve;
          posterImg.onerror = reject;
          posterImg.src = el.src;
        });

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
          <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10 z-20">
            <h3 className="font-display text-xl text-white font-semibold">
              {posters.length > 1 ? 'Wall Design Generator' : 'Virtual Try-On'}
            </h3>
            <div className="flex items-center gap-3">
              {posters.length > 1 && (
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingToCart}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-luxe-accent transition-colors disabled:opacity-50"
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
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Draggable Posters */}
                {posters.map((poster, index) => (
                  <motion.img
                    key={poster.id}
                    src={poster.url}
                    alt={`Poster ${index}`}
                    drag
                    dragConstraints={containerRef}
                    dragElastic={0}
                    dragMomentum={false}
                    initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
                    animate={{ scale: poster.baseScale * globalScale, opacity: 1, x: '-50%', y: '-50%' }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                    style={{
                      position: 'absolute',
                      top: `${poster.initialY}%`,
                      left: `${poster.initialX}%`,
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 10px 20px -5px rgba(0,0,0,0.4)',
                      cursor: 'grab',
                      touchAction: 'none',
                      transformOrigin: 'center center'
                    }}
                    whileDrag={{ cursor: 'grabbing', scale: (poster.baseScale * globalScale) * 1.05 }}
                    className="collage-poster-img max-h-[80vh] w-auto border-4 border-white/5 bg-white/5"
                    crossOrigin="anonymous"
                  />
                ))}

                {/* Bottom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full px-4 md:w-auto">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 z-10 w-full md:w-auto overflow-x-auto no-scrollbar">
                    
                    <button 
                      onClick={handleAutoDesign}
                      disabled={isFetchingLibrary}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-luxe-accent to-luxe-accent/80 text-black font-semibold hover:brightness-110 active:scale-95 transition-all flex-shrink-0"
                    >
                      {isFetchingLibrary ? (
                        <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      Auto Design
                    </button>

                    <div className="w-px h-8 bg-white/20 mx-1 flex-shrink-0" />

                    <button 
                      onClick={() => setGlobalScale(s => Math.max(0.3, s - 0.1))}
                      className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all flex-shrink-0"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    
                    <button 
                      onClick={() => setGlobalScale(s => Math.min(2.5, s + 0.1))}
                      className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all flex-shrink-0"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    
                    <div className="w-px h-8 bg-white/20 mx-1 flex-shrink-0" />
                    
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {saving ? (
                        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      Save
                    </button>
                  </div>
                </div>

                {/* Change photo button */}
                <label className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-sm hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20">
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
