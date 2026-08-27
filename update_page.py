import re

with open('src/app/(main)/product/custom-photo-poster/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useRouter and Link imports
content = content.replace(
    "import { ShoppingCart, Sparkles, ShieldCheck, Truck, RefreshCw, AlertTriangle } from 'lucide-react';",
    "import { ShoppingCart, Sparkles, ShieldCheck, Truck, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';\nimport { useRouter } from 'next/navigation';\nimport Link from 'next/link';"
)

# Update useCart destructuring
content = content.replace(
    "  const { addItem } = useCart();",
    "  const { addItem, updateQuantity, items: cartItems } = useCart();\n  const router = useRouter();"
)

# Replace states
content = re.sub(
    r"  const \[selectedSize, setSelectedSize\] = useState<string>\(''\);\n  const \[selectedFrame, setSelectedFrame\] = useState<string>\(''\);",
    "  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});\n  const [productOptions, setProductOptions] = useState<any[]>([]);",
    content
)

# Init logic
init_regex = r"// Parse _v2_variants[\s\S]*?\} catch \(e\) \{"
new_init = """// Parse _v2_variants
        const v2Variants = pData.attributes?._v2_variants;
        if (v2Variants && v2Variants.options) {
          setProductOptions(v2Variants.options);
          
          const initialSelections: Record<string, string> = {};
          v2Variants.options.forEach((opt: any) => {
            initialSelections[opt.name] = opt.values[0] || '';
          });
          setSelectedOptions(initialSelections);
        }
      } catch (e) {"""
content = re.sub(init_regex, new_init, content)

# useEffect logic
useEffect_regex = r"  // Update total price when selection changes[\s\S]*?\}, \[selectedSize, selectedFrame, product\]\);"
new_useEffect = """  // Update total price and dynamic options when selection changes
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
  }, [selectedOptions, product]);"""
content = re.sub(useEffect_regex, new_useEffect, content)

# handleAddToCart logic
handleAddToCart_regex = r"    try \{[\s\S]*?      let comboLabel = `\$\{selectedSize\} \/ \$\{selectedFrame\}`;[\s\S]*?      toast\.success\('Custom Photo Poster added to cart!'\);\n    \} catch"
new_handleAddToCart = """    try {
      const v2Variants = product.attributes?._v2_variants;
      let matchedVariant = null;

      if (v2Variants && v2Variants.combinations) {
        const combo = v2Variants.combinations.find((c: any) => {
          return Object.entries(selectedOptions).every(([k, v]) => c.options[k] === v);
        });
        if (combo) {
          const comboLabel = Object.values(combo.options).join(' / ');
          matchedVariant = product.sizes.find((s: any) => s.label === comboLabel);
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

    } catch"""
content = re.sub(handleAddToCart_regex, new_handleAddToCart, content)

# Finding cart items and UI mappings
cart_quantity_logic = """
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
        const comboLabel = Object.values(combo.options).join(' / ');
        const matched = product.sizes.find((s: any) => s.label === comboLabel);
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
"""

content = content.replace("  return (", cart_quantity_logic + "\n  return (")

# Update Upload photo
content = content.replace("selectedSize={selectedSize}", "selectedSize={selectedOptions[sizeOptionName] || 'A4'}")
content = content.replace("onSelectRecommendedSize={(sz) => setSelectedSize(sz)}", "onSelectRecommendedSize={(sz) => setSelectedOptions(prev => ({ ...prev, [sizeOptionName]: sz }))}")

# Update sizes and frames selectors
content = content.replace("onSelectSize={(s) => setSelectedSize(s)}", "onSelectSize={(s) => setSelectedOptions(prev => ({ ...prev, [sizeOptionName]: s }))}")
content = content.replace("selectedFrame={selectedFrame}", "selectedFrame={selectedOptions[frameOptionName] || ''}")
content = content.replace("onSelectFrame={(f) => setSelectedFrame(f)}", "onSelectFrame={(f) => setSelectedOptions(prev => ({ ...prev, [frameOptionName]: f }))}")

# Update Generic selectors injection
generic_selectors = """
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
"""
content = content.replace(
    "                />\n              )}\n            </div>",
    "                />\n              )}\n" + generic_selectors + "\n            </div>"
)

# Fix string representation in summary
summary_replace_regex = r"                    \{selectedSize\} \{dynamicFrames\.length > 0 && `• \$\{selectedFrame === 'None' \? 'No Frame' : `\$\{selectedFrame\.toUpperCase\(\)\} Frame`\}`\}"
new_summary = "                    {Object.values(selectedOptions).join(' • ')}"
content = re.sub(summary_replace_regex, new_summary, content)

# Update Cart Buttons
cart_buttons_regex = r"              \{\/\* Add to Cart Button \*\/\}[\s\S]*?              <\/button>"
new_cart_buttons = """              {/* Add to Cart Section */}
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
              )}"""
content = re.sub(cart_buttons_regex, new_cart_buttons, content)

with open('src/app/(main)/product/custom-photo-poster/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated page.tsx")
