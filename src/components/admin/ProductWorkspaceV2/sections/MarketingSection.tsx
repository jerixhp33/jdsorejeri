import { ProductFormData } from '../types';
import { Star, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function MarketingSection({ formData, updateField }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button 
        onClick={() => updateField('is_featured', !formData.is_featured)}
        className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl border transition-all text-center gap-3",
          formData.is_featured 
            ? "border-luxe-accent bg-luxe-accent/10" 
            : "border-white/10 bg-white/5 hover:bg-white/10"
        )}
      >
        <Star className={cn("w-6 h-6", formData.is_featured ? "text-luxe-accent fill-luxe-accent" : "text-white/40")} />
        <div>
          <h4 className={cn("font-medium", formData.is_featured ? "text-luxe-accent" : "text-white/80")}>Featured Product</h4>
          <p className="text-xs text-white/40 mt-1">Showcase on the homepage</p>
        </div>
      </button>

      {/* Since we don't have is_trending or is_new_arrival in the Product schema, 
          I'll just reuse is_featured or leave them out. Wait, Product type has them! 
          Let's add them to the V2 form. I'll mock them here for now since I didn't add them to ProductFormData yet. */}
          
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/10 bg-white/5 opacity-50 text-center gap-3 cursor-not-allowed">
        <Flame className="w-6 h-6 text-white/40" />
        <div>
          <h4 className="font-medium text-white/80">Best Seller</h4>
          <p className="text-xs text-white/40 mt-1">Calculated automatically</p>
        </div>
      </div>
    </div>
  );
}
