'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Sparkles, ShieldCheck, Truck, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { CustomPosterUpload } from '@/components/customizer/CustomPosterUpload';
import { WallPlacementDetector } from '@/components/customizer/WallPlacementDetector';
import { PosterSizeSelector, PosterSizeOption } from '@/components/customizer/PosterSizeSelector';
import { FrameSelector, FrameOption } from '@/components/customizer/FrameSelector';
import { createClient } from '@/lib/supabase/client';
import type { CustomUploadRecord } from '@/lib/custom-poster';
import type { ImageQualityAnalysis } from '@/lib/image-quality';

export default function CustomPhotoPosterPage() {
  const { addItem } = useCart();
  const [userId, setUserId] = useState<string | null>(null);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Options state
  const [dynamicSizes, setDynamicSizes] = useState<PosterSizeOption[]>([]);
  const [dynamicFrames, setDynamicFrames] = useState<FrameOption[]>([]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  const [uploadRecord, setUploadRecord] = useState<CustomUploadRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageQualityAnalysis | null>(null);

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      try {
        // Fetch the dynamic product
        const { data: pData, error } = await supabase
          .from('products')
          .select('*, sizes:poster_sizes(*)')
          .eq('slug', 'custom-photo-poster')
          .single();

        if (error || !pData) {
          console.error('Failed to load product:', error);
          setLoading(false);
          return;
        }

        setProduct(pData);

        // Parse _v2_variants
        const v2Variants = pData.attributes?._v2_variants;
        if (v2Variants && v2Variants.options) {
          const sizeOption = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('size'));
          const frameOption = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('frame'));

          // Initialize selections
          const defaultSize = sizeOption?.values[0] || '';
          const defaultFrame = frameOption?.values[0] || '';
          setSelectedSize(defaultSize);
          setSelectedFrame(defaultFrame);

          // Build dynamic Sizes
          if (sizeOption) {
            const parsedSizes: PosterSizeOption[] = sizeOption.values.map((sz: string) => {
              // Find the combo for this size with the default frame to get base price
              const combo = v2Variants.combinations.find(
                (c: any) => c.options[sizeOption.name] === sz && (!frameOption || c.options[frameOption.name] === defaultFrame)
              );
              return {
                id: sz,
                name: `${sz} Size`,
                dimensionsMm: sz === 'A5' ? '148 × 210 mm' : sz === 'A4' ? '210 × 297 mm' : 'See details',
                price: combo?.price || 0
              };
            });
            setDynamicSizes(parsedSizes);
          }

          // Build dynamic Frames
          if (frameOption) {
            const parsedFrames: FrameOption[] = frameOption.values.map((fr: string) => {
              // Find the difference in price vs the default frame
              const baseCombo = v2Variants.combinations.find(
                (c: any) => c.options[sizeOption?.name || 'Size'] === defaultSize && c.options[frameOption.name] === defaultFrame
              );
              const thisCombo = v2Variants.combinations.find(
                (c: any) => c.options[sizeOption?.name || 'Size'] === defaultSize && c.options[frameOption.name] === fr
              );
              
              const addonPrice = (thisCombo?.price || 0) - (baseCombo?.price || 0);

              let colorClass = 'bg-transparent border-dashed border-white/30';
              if (fr.toLowerCase().includes('black')) colorClass = 'bg-neutral-900 border-neutral-950';
              if (fr.toLowerCase().includes('white')) colorClass = 'bg-stone-100 border-stone-300';
              if (fr.toLowerCase().includes('wood')) colorClass = 'bg-[#8B5A2B] border-[#5c3a1b]';

              return {
                id: fr,
                name: fr === 'None' ? 'No Frame (Print Only)' : `${fr} Frame`,
                priceAddon: addonPrice > 0 ? addonPrice : 0,
                colorClass
              };
            });
            setDynamicFrames(parsedFrames);
          }
        }
      } catch (e) {
        console.error('Exception loading product:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Update total price when selection changes
  useEffect(() => {
    if (product && selectedSize) {
      const v2Variants = product.attributes?._v2_variants;
      if (v2Variants && v2Variants.options) {
        const sizeOptionName = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('size'))?.name || 'Size';
        const frameOption = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('frame'));
        
        const combo = v2Variants.combinations.find(
          (c: any) => c.options[sizeOptionName] === selectedSize && (!frameOption || c.options[frameOption.name] === selectedFrame)
        );
        if (combo) {
          setTotalPrice(combo.price);
        }
      }
    }
  }, [selectedSize, selectedFrame, product]);

  const handleAddToCart = async () => {
    if (!uploadRecord || !previewUrl) {
      toast.error('Please upload your photo before adding to cart.');
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      const v2Variants = product.attributes?._v2_variants;
      let comboLabel = `${selectedSize} / ${selectedFrame}`;

      if (v2Variants && v2Variants.options) {
        const sizeOptionName = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('size'))?.name || 'Size';
        const frameOption = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('frame'));
        
        const combo = v2Variants.combinations.find(
          (c: any) => c.options[sizeOptionName] === selectedSize && (!frameOption || c.options[frameOption.name] === selectedFrame)
        );
        if (combo) {
          comboLabel = Object.values(combo.options).join(' / ');
        }
      }

      // Find the specific poster_size.id for this variant combo
      const matchedVariant = product.sizes.find((s: any) => s.label === comboLabel);

      if (!matchedVariant) {
        throw new Error('Variant not found in database for label: ' + comboLabel);
      }

      // Add custom item to cart using REAL database UUIDs
      await addItem(
        product.id,
        matchedVariant.price,
        1,
        matchedVariant.id, // posterSizeId is now the variant UUID!
        false,
        uploadRecord.id
      );

      toast.success('Custom Photo Poster added to cart!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to add custom poster to cart');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-luxe-black flex items-center justify-center text-white/50">Loading customizer...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-luxe-black flex flex-col items-center justify-center text-white space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h1 className="text-2xl font-bold">Product Unavailable</h1>
        <p className="text-white/50">The custom photo poster is not configured in the store yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxe-black text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> High-Clarity Custom Printing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {product.name || 'Create Your Custom Photo Poster'}
          </h1>
          <p className="text-sm sm:text-base text-white/60">
            {product.description || 'Upload your personal memories or photos. Printed on premium 300 GSM Gallery Paper (Ultra-Matte Archival Finish) with museum-grade precision.'}
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
                sizes={dynamicSizes}
              />

              {dynamicFrames.length > 0 && (
                <FrameSelector
                  selectedFrame={selectedFrame}
                  onSelectFrame={(f) => setSelectedFrame(f)}
                  frames={dynamicFrames}
                />
              )}
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
                  <p className="text-xs text-white/50">
                    {selectedSize} {dynamicFrames.length > 0 && `• ${selectedFrame === 'None' ? 'No Frame' : `${selectedFrame.toUpperCase()} Frame`}`}
                  </p>
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

