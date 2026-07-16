import { ProductFormData } from '../types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function PricingSection({ formData, updateField }: Props) {
  const profit = formData.price - formData.cost_price;
  const margin = formData.price > 0 ? (profit / formData.price) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-foreground/ text-xs uppercase tracking-wide mb-2 block">Selling Price (₹) *</label>
          <input 
            type="number"
            value={formData.price}
            onChange={(e) => updateField('price', Number(e.target.value))}
            className="input-luxe w-full text-xl"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-foreground/ text-xs uppercase tracking-wide mb-2 block">Original Price (₹)</label>
          <input 
            type="number"
            value={formData.original_price}
            onChange={(e) => updateField('original_price', Number(e.target.value))}
            className="input-luxe w-full text-foreground/ line-through"
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div className="border-t border-foreground/ pt-6 grid grid-cols-2 gap-4">
        <div>
          <label className="text-foreground/ text-xs uppercase tracking-wide mb-2 block">Cost Price (₹)</label>
          <input 
            type="number"
            value={formData.cost_price}
            onChange={(e) => updateField('cost_price', Number(e.target.value))}
            className="input-luxe w-full"
            placeholder="0.00"
          />
        </div>
        
        {/* Calculator Analytics */}
        <div className="bg-luxe-accent/5 rounded-xl border border-luxe-accent/20 p-4 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <span className="text-foreground/ text-xs">Profit</span>
            <span className="text-luxe-accent font-medium">{formatCurrency(profit > 0 ? profit : 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground/ text-xs">Margin</span>
            <span className="text-luxe-accent font-medium">{margin > 0 ? margin.toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
