import { ProductFormData } from '../types';
import { Star, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function MarketingSection({ formData, updateField }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button 
        onClick={() => updateField('is_featured', !formData.is_featured)}
        className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl border transition-all text-center gap-3",
          formData.is_featured 
            ? "border-luxe-accent bg-luxe-accent/10" 
            : "border-foreground/ bg-foreground/ hover:bg-foreground/"
        )}
      >
        <Star className={cn("w-6 h-6", formData.is_featured ? "text-luxe-accent fill-luxe-accent" : "text-foreground/")} />
        <div>
          <h4 className={cn("font-medium", formData.is_featured ? "text-luxe-accent" : "text-foreground/")}>Featured</h4>
          <p className="text-xs text-foreground/ mt-1">Showcase on the homepage</p>
        </div>
      </button>

      <button 
        onClick={() => updateField('is_trending', !formData.is_trending)}
        className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl border transition-all text-center gap-3",
          formData.is_trending 
            ? "border-luxe-accent bg-luxe-accent/10" 
            : "border-foreground/ bg-foreground/ hover:bg-foreground/"
        )}
      >
        <TrendingUp className={cn("w-6 h-6", formData.is_trending ? "text-luxe-accent" : "text-foreground/")} />
        <div>
          <h4 className={cn("font-medium", formData.is_trending ? "text-luxe-accent" : "text-foreground/")}>Trending</h4>
          <p className="text-xs text-foreground/ mt-1">Highlight as popular</p>
        </div>
      </button>
          
      <button 
        onClick={() => updateField('is_best_seller', !formData.is_best_seller)}
        className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl border transition-all text-center gap-3",
          formData.is_best_seller 
            ? "border-luxe-accent bg-luxe-accent/10" 
            : "border-foreground/ bg-foreground/ hover:bg-foreground/"
        )}
      >
        <Flame className={cn("w-6 h-6", formData.is_best_seller ? "text-luxe-accent" : "text-foreground/")} />
        <div>
          <h4 className={cn("font-medium", formData.is_best_seller ? "text-luxe-accent" : "text-foreground/")}>Best Seller</h4>
          <p className="text-xs text-foreground/ mt-1">Mark as top selling</p>
        </div>
      </button>
    </div>
  );
}
