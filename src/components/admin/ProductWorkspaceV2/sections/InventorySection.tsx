import { ProductFormData } from '../types';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function InventorySection({ formData, updateField }: Props) {
  const hasVariants = formData.variant_combinations && formData.variant_combinations.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">SKU (Stock Keeping Unit)</label>
          <input 
            type="text"
            value={formData.sku}
            onChange={(e) => updateField('sku', e.target.value)}
            className="input-luxe w-full"
            placeholder="e.g. EAR-GLD-001"
            disabled={hasVariants}
          />
        </div>
        
        <div>
          <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Quantity in Stock *</label>
          <input 
            type="number"
            value={formData.stock}
            onChange={(e) => updateField('stock', Number(e.target.value))}
            className="input-luxe w-full"
            placeholder="0"
            disabled={hasVariants}
          />
        </div>
      </div>
      
      {hasVariants && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/60">
          Inventory and SKU are managed at the variant level because this product has variants.
        </div>
      )}

      <div>
        <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Product Status</label>
        <select 
          value={formData.status}
          onChange={(e) => updateField('status', e.target.value as any)}
          className="input-luxe w-full"
        >
          <option value="draft">Draft (Hidden)</option>
          <option value="active">Active (Visible)</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
  );
}
