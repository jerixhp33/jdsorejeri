import { useState } from 'react';
import { ProductFormData } from './types';
import { formatCurrency, cn } from '@/lib/utils';
import Image from 'next/image';
import { Monitor, Tablet, Smartphone, Star, Heart, ShoppingBag } from 'lucide-react';
import { useProductHealth } from './hooks/useProductHealth';

interface LivePreviewProps {
  formData: ProductFormData;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export function LivePreview({ formData }: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const { score } = useProductHealth(formData);

  const primaryImage = formData.images?.find(i => i.is_primary) || formData.images?.[0];
  const activeCombinations = formData.variant_combinations?.filter(c => c.is_active) || [];
  
  // Calculate display price based on variants if applicable
  const displayPrice = activeCombinations.length > 0 
    ? Math.min(...activeCombinations.map(c => c.price))
    : formData.price;

  return (
    <div className="w-96 flex-shrink-0 hidden xl:flex flex-col border-l border-white/10 bg-[#0a0a0a]">
      {/* Device Toggle Bar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-center gap-2 flex-shrink-0 bg-black/50">
        <button onClick={() => setDevice('desktop')} className={cn("p-2 rounded-lg transition-colors", device === 'desktop' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}>
          <Monitor className="w-4 h-4" />
        </button>
        <button onClick={() => setDevice('tablet')} className={cn("p-2 rounded-lg transition-colors", device === 'tablet' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}>
          <Tablet className="w-4 h-4" />
        </button>
        <button onClick={() => setDevice('mobile')} className={cn("p-2 rounded-lg transition-colors", device === 'mobile' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}>
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Preview Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        
        {/* Device Container */}
        <div 
          className={cn(
            "w-full transition-all duration-300",
            device === 'mobile' ? 'max-w-[320px]' : device === 'tablet' ? 'max-w-[480px]' : 'max-w-full'
          )}
        >
          <div className="text-white/30 text-[10px] uppercase tracking-widest mb-3 text-center">
            Storefront Preview ({device})
          </div>
          
          {/* Simulated Product Card */}
          <div className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 group">
            <div className="relative aspect-[4/5] bg-black">
              {primaryImage ? (
                <Image src={primaryImage.url} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
                  <Star className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">No Image</span>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {formData.product_type && (
                  <span className="bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded capitalize">
                    {formData.product_type}
                  </span>
                )}
                {formData.is_featured && (
                  <span className="bg-[#c8a96e] text-black text-[10px] font-bold px-2 py-0.5 rounded">
                    FEATURED
                  </span>
                )}
                {formData.original_price > formData.price && (
                  <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded">
                    -{Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)}%
                  </span>
                )}
              </div>
              
              {/* Actions */}
              <div className="absolute top-3 right-3">
                <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                  {formData.category_id ? 'Category Name' : 'Uncategorized'}
                </p>
                <h3 className="text-white/90 font-medium text-sm line-clamp-2 leading-snug">
                  {formData.name || 'Product Name'}
                </h3>
              </div>
              
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-[#c8a96e] fill-[#c8a96e]" />)}
                </div>
                <span className="text-white/40 text-[10px] ml-1">(0)</span>
              </div>
              
              <div className="flex items-end justify-between pt-1">
                <div>
                  {activeCombinations.length > 0 && <p className="text-white/40 text-[10px] mb-0.5">From</p>}
                  <div className="flex items-center gap-2">
                    <p className="text-[#c8a96e] font-semibold text-lg">
                      {formatCurrency(displayPrice || 0)}
                    </p>
                    {formData.original_price > formData.price && (
                      <p className="text-white/30 text-xs line-through decoration-white/20">
                        {formatCurrency(formData.original_price)}
                      </p>
                    )}
                  </div>
                </div>
                <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10">
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
              
              {/* Stock Warning Simulation */}
              {(formData.stock > 0 && formData.stock <= 5 && activeCombinations.length === 0) && (
                <p className="text-red-400 text-[10px] font-medium pt-2">Only {formData.stock} left in stock</p>
              )}
            </div>
          </div>
        </div>

        {/* Product Health */}
        <div className="mt-8 w-full">
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-luxe-accent/5 rounded-full blur-3xl group-hover:bg-luxe-accent/10 transition-colors" />
            <h4 className="text-white text-sm font-medium mb-3 flex items-center justify-between relative z-10">
              Product Health
              <span className={cn(
                "font-bold text-lg",
                score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"
              )}>
                {score}%
              </span>
            </h4>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden relative z-10">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  score >= 80 ? "bg-green-400" : score >= 50 ? "bg-yellow-400" : "bg-red-400"
                )}
                style={{ width: `${score}%` }} 
              />
            </div>
            
            <ul className="mt-4 space-y-1.5 relative z-10">
              <li className="flex items-center justify-between text-xs">
                <span className="text-white/50">Images (20%)</span>
                <span className={formData.images?.length > 0 ? "text-green-400" : "text-white/20"}>{formData.images?.length > 0 ? "✓" : "-"}</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-white/50">Price (15%)</span>
                <span className={formData.price > 0 ? "text-green-400" : "text-white/20"}>{formData.price > 0 ? "✓" : "-"}</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-white/50">Description (15%)</span>
                <span className={formData.description?.length > 20 ? "text-green-400" : "text-white/20"}>{formData.description?.length > 20 ? "✓" : "-"}</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-white/50">SEO (15%)</span>
                <span className={formData.seo_title && formData.seo_description ? "text-green-400" : "text-white/20"}>{formData.seo_title && formData.seo_description ? "✓" : "-"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
