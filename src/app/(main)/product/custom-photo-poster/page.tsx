'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Sparkles, ShieldCheck, Truck, RefreshCw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { CustomPosterUpload } from '@/components/customizer/CustomPosterUpload';
import { WallPlacementDetector } from '@/components/customizer/WallPlacementDetector';
import { PosterSizeSelector } from '@/components/customizer/PosterSizeSelector';
import { FrameSelector } from '@/components/customizer/FrameSelector';
import { createClient } from '@/lib/supabase/client';
import type { CustomUploadRecord } from '@/lib/custom-poster';
import type { ImageQualityAnalysis } from '@/lib/image-quality';

export default function CustomPhotoPosterPage() {
  const { addItem } = useCart();
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<'A5' | 'A4' | 'A3'>('A4');
  const [selectedFrame, setSelectedFrame] = useState<'none' | 'black' | 'white' | 'wood'>('none');
  
  const [uploadRecord, setUploadRecord] = useState<CustomUploadRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageQualityAnalysis | null>(null);

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  // Pricing calculation
  const sizePrices = { A5: 199, A4: 299, A3: 449 };
  const frameAddons = { none: 0, black: 150, white: 150, wood: 200 };
  const basePrice = sizePrices[selectedSize];
  const framePrice = frameAddons[selectedFrame];
  const totalPrice = basePrice + framePrice;

  const handleAddToCart = async () => {
    if (!uploadRecord || !previewUrl) {
      toast.error('Please upload your photo before adding to cart.');
      return;
    }

    setIsAdding(true);
    try {
      // Add custom item to cart
      await addItem({
        id: `custom-${uploadRecord.id}`,
        product_id: 'custom-poster-product',
        title: `Custom Photo Poster (${selectedSize})`,
        price: totalPrice,
        quantity: 1,
        image_url: previewUrl,
        size: selectedSize,
        frame: selectedFrame,
        custom_upload_id: uploadRecord.id,
        metadata: {
          custom_upload_id: uploadRecord.id,
          custom_image_url: previewUrl,
          custom_width: uploadRecord.width,
          custom_height: uploadRecord.height,
          custom_resolution: `${uploadRecord.width}x${uploadRecord.height}`,
          custom_file_size: uploadRecord.file_size,
          poster_size_id: selectedSize,
          frame_choice: selectedFrame,
          quality_status: uploadRecord.quality_status
        }
      } as any);

      toast.success('Custom Photo Poster added to cart!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to add custom poster to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxe-black text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> High-Clarity Custom Printing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Create Your Custom Photo Poster
          </h1>
          <p className="text-sm sm:text-base text-white/60">
            Upload your personal memories, artwork, or photos. We print on premium 300 GSM gallery paper with museum-grade precision.
          </p>
        </div>

        {/* Main Grid: Upload & Options (Left) + Wall Preview & Cart (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Options */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Upload Photo */}
            <div className="bg-luxe-gray/60 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center">1</span>
                Upload Your Photo
              </h2>
              <CustomPosterUpload
                userId={userId}
                selectedSize={selectedSize}
                onUploadSuccess={(rec, prev, ana) => {
                  setUploadRecord(rec);
                  setPreviewUrl(prev);
                  setAnalysis(ana);
                }}
                onClearUpload={() => {
                  setUploadRecord(null);
                  setPreviewUrl(null);
                  setAnalysis(null);
                }}
                onSelectRecommendedSize={(sz) => setSelectedSize(sz)}
              />
            </div>

            {/* Step 2: Size & Framing */}
            <div className="bg-luxe-gray/60 border border-white/10 rounded-2xl p-6 space-y-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center">2</span>
                Choose Size & Framing
              </h2>

              <PosterSizeSelector
                selectedSize={selectedSize}
                onSelectSize={(s) => setSelectedSize(s)}
              />

              <FrameSelector
                selectedFrame={selectedFrame}
                onSelectFrame={(f) => setSelectedFrame(f)}
              />
            </div>
          </div>

          {/* Right Column: Wall Preview & Add to Cart */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Interactive Room Wall Preview */}
            {previewUrl ? (
              <WallPlacementDetector
                customImagePreview={previewUrl}
                selectedSize={selectedSize}
                selectedFrame={selectedFrame}
              />
            ) : (
              <div className="bg-luxe-gray/60 border border-white/10 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium text-white/80">Interactive Wall Preview</h3>
                <p className="text-xs text-white/50">Upload a photo to see it placed on realistic room walls in A4/A5 scale.</p>
              </div>
            )}

            {/* Summary & Checkout Card */}
            <div className="bg-luxe-gray/90 border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Custom Photo Poster</h3>
                  <p className="text-xs text-white/50">{selectedSize} • {selectedFrame === 'none' ? 'No Frame' : `${selectedFrame.toUpperCase()} Frame`}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-amber-400">₹{totalPrice}</span>
                  <span className="text-[10px] text-white/40 block">Free Shipping</span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>300 GSM Gallery Paper</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Dispatched in 24h</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!uploadRecord || isAdding}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                  uploadRecord
                    ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/20 active:scale-[0.99]'
                    : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                }`}
              >
                {isAdding ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {uploadRecord ? 'Add Custom Poster to Cart' : 'Upload Photo to Continue'}
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
