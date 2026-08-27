'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Sparkles, ShieldCheck, Truck, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomPosterUpload } from '@/components/customizer/CustomPosterUpload';
import { WallPlacementDetector } from '@/components/customizer/WallPlacementDetector';
import { PosterSizeSelector, PosterSizeOption } from '@/components/customizer/PosterSizeSelector';
import { FrameSelector, FrameOption } from '@/components/customizer/FrameSelector';
import { createClient } from '@/lib/supabase/client';
import type { CustomUploadRecord } from '@/lib/custom-poster';
import type { ImageQualityAnalysis } from '@/lib/image-quality';

export default function CustomPhotoPosterPage() {
  const { addItem, updateQuantity, items: cartItems, deliverySettings } = useCart();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Options state
  const [dynamicSizes, setDynamicSizes] = useState<PosterSizeOption[]>([]);
  const [dynamicFrames, setDynamicFrames] = useState<FrameOption[]>([]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [productOptions, setProductOptions] = useState<any[]>([]);
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
          setProductOptions(v2Variants.options);
          
          const initialSelections: Record<string, string> = {};
          v2Variants.options.forEach((opt: any) => {
            initialSelections[opt.name] = opt.values[0] || '';
          });
          setSelectedOptions(initialSelections);
        }
      } catch (e) {
        console.error('Exception loading product:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Update total price and dynamic options when selection changes
  useEffect(() => {
    if (product && Object.keys(selectedOptions).length > 0) {
      const v2Variants = product.attributes?._v2_variants;
      if (v2Variants && v2Variants.combinations) {
        const combo = v2Variants.combinations.find((c: any) => {
          return Object.entries(selectedOptions).every(([k, v]) => c.options[k] === v);
        });
        if (combo) {
          setTotalPrice(combo.price);
        }

        // Rebuild dynamicSizes
        const sizeOption = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('size'));
        if (sizeOption) {
          const parsedSizes: PosterSizeOption[] = sizeOption.values.map((sz: string) => {
            const tempOpts = { ...selectedOptions, [sizeOption.name]: sz };
            const tempCombo = v2Variants.combinations.find((c: any) => Object.entries(tempOpts).every(([k, v]) => c.options[k] === v));
            return {
              id: sz,
              name: `${sz} Size`,
              dimensionsMm: sz === 'A5' ? '148 × 210 mm' : sz === 'A4' ? '210 × 297 mm' : 'See details',
              price: tempCombo?.price || 0
            };
          });
          setDynamicSizes(parsedSizes);
        }

        // Rebuild dynamicFrames
        const frameOption = v2Variants.options.find((o: any) => o.name?.toLowerCase().includes('frame'));
        if (frameOption) {
          const baseOpts = { ...selectedOptions, [frameOption.name]: frameOption.values[0] };
          const baseCombo = v2Variants.combinations.find((c: any) => Object.entries(baseOpts).every(([k, v]) => c.options[k] === v));
          
          const parsedFrames: FrameOption[] = frameOption.values.map((fr: string) => {
            const tempOpts = { ...selectedOptions, [frameOption.name]: fr };
            const tempCombo = v2Variants.combinations.find((c: any) => Object.entries(tempOpts).every(([k, v]) => c.options[k] === v));
            const addonPrice = (tempCombo?.price || 0) - (baseCombo?.price || 0);

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
    }
  }, [selectedOptions, product]);

  const handleAddToCart = async () => {
    if (!uploadRecord || !previewUrl) {
      toast.error('Please upload your photo before adding to cart.');
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      const v2Variants = product.attributes?._v2_variants;
      let matchedVariant = null;

      if (v2Variants && v2Variants.combinations) {
        const combo = v2Variants.combinations.find((c: any) => {
          return Object.entries(selectedOptions).every(([k, v]) => c.options[k] === v);
        });
        if (combo) {
          const optionValues = Object.values(combo.options).map(v => String(v).toLowerCase());
          matchedVariant = product.sizes.find((s: any) => {
            const labelLower = s.label.toLowerCase();
            return optionValues.every(val => labelLower.includes(val));
          });
        }
      }

      if (!matchedVariant) {
        throw new Error('Variant not found in database for selected options.');
      }

      // Add custom item to cart using REAL database UUIDs
      // We pass silent=true to prevent double toast
      await addItem(
        product.id,
        matchedVariant.price,
        1,
        matchedVariant.id,
        true, // silent
        uploadRecord.id
      );

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

  const sizeOptionName = productOptions.find(o => o.name?.toLowerCase().includes('size'))?.name || 'Size';
  const frameOptionName = productOptions.find(o => o.name?.toLowerCase().includes('frame'))?.name || 'Frame';
  const genericOptions = productOptions.filter(o => !o.name?.toLowerCase().includes('size') && !o.name?.toLowerCase().includes('frame'));

  // Find existing cart item for current selection
  let matchedVariantId: string | null = null;
  if (product && product.sizes) {
    const v2Variants = product.attributes?._v2_variants;
    if (v2Variants && v2Variants.combinations) {
      const combo = v2Variants.combinations.find((c: any) => Object.entries(selectedOptions).every(([k, v]) => c.options[k] === v));
      if (combo) {
        // Create an array of selected option values and check if all of them are present in the label (case insensitive)
        const optionValues = Object.values(combo.options).map(v => String(v).toLowerCase());
        const matched = product.sizes.find((s: any) => {
          const labelLower = s.label.toLowerCase();
          return optionValues.every(val => labelLower.includes(val));
        });
        if (matched) matchedVariantId = matched.id;
      }
    }
  }

  const existingCartItem = matchedVariantId && uploadRecord 
    ? cartItems.find(i => 
        i.product_id === product?.id && 
        i.poster_size_id === matchedVariantId && 
        i.custom_upload_id === uploadRecord.id
      ) 
    : null;
  
  const cartQuantity = existingCartItem?.quantity || 0;

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
                selectedSize={selectedOptions[sizeOptionName] || 'A4'}
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
                onSelectRecommendedSize={(sz) => setSelectedOptions(prev => ({ ...prev, [sizeOptionName]: sz }))}
              />
            </div>

            {/* Step 2: Size & Framing */}
            <div className="bg-luxe-gray/60 border border-white/10 rounded-2xl p-6 space-y-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center">2</span>
                Choose Size{dynamicFrames.length > 0 ? ' & Framing' : ''}
              </h2>

              <PosterSizeSelector
                selectedSize={selectedOptions[sizeOptionName] || ''}
                onSelectSize={(s) => setSelectedOptions(prev => ({ ...prev, [sizeOptionName]: s }))}
                sizes={dynamicSizes}
              />

              {dynamicFrames.length > 0 && (
                <FrameSelector
                  selectedFrame={selectedOptions[frameOptionName] || ''}
                  onSelectFrame={(f) => setSelectedOptions(prev => ({ ...prev, [frameOptionName]: f }))}
                  frames={dynamicFrames}
                />
              )}

              {genericOptions.map((opt, idx) => (
                <div key={opt.name} className="space-y-2 pt-4 border-t border-white/5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                    {3 + idx}. Select {opt.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val: string) => (
                      <button
                        key={val}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          selectedOptions[opt.name] === val
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Wall Preview & Add to Cart */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Interactive Room Wall Preview */}
            {previewUrl ? (
              <WallPlacementDetector
                customImagePreview={previewUrl}
                selectedSize={selectedOptions[sizeOptionName] || ''}
                selectedFrame={selectedOptions[frameOptionName] || ''}
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
                  <p className="text-xs text-white/50 mt-1">
                    {Object.values(selectedOptions).join(' • ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-amber-400">₹{totalPrice}</span>
                  <span className="text-[10px] text-white/40 block">
                    {totalPrice >= deliverySettings.threshold ? 'Free Shipping' : `+ ₹${deliverySettings.charge} Shipping`}
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Dispatched in 24h</span>
                </div>
              </div>

              {/* Add to Cart Section */}
              {cartQuantity === 0 ? (
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
              ) : (
                <div className="flex gap-4">
                  {/* Quantity Selector */}
                  <div className="flex-1 flex items-center justify-between rounded-xl overflow-hidden border border-amber-400/50 bg-amber-400/10 h-[52px]">
                    <button
                      onClick={() => existingCartItem && updateQuantity(existingCartItem.id, cartQuantity - 1)}
                      className="h-full px-6 text-white hover:text-amber-400 hover:bg-white/5 active:scale-95 transition-all text-xl"
                    >
                      −
                    </button>
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-white text-base font-bold">{cartQuantity}</span>
                      <span className="text-amber-400/80 text-[10px] uppercase tracking-wider font-semibold -mt-1">In Cart</span>
                    </div>
                    <button
                      onClick={() => existingCartItem && updateQuantity(existingCartItem.id, cartQuantity + 1)}
                      className="h-full px-6 text-white hover:text-amber-400 hover:bg-white/5 active:scale-95 transition-all text-xl"
                    >
                      +
                    </button>
                  </div>

                  {/* Go to Cart (Desktop Only) */}
                  <button
                    onClick={() => router.push('/cart')}
                    className="hidden md:flex flex-1 items-center justify-center gap-2 h-[52px] rounded-xl font-bold text-sm bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20"
                  >
                    Go to Cart <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
