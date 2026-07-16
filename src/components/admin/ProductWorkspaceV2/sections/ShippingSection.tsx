import { ProductFormData } from '../types';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function ShippingSection({ formData, updateField }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-foreground/ text-xs uppercase tracking-wide mb-2 block">Weight (grams)</label>
        <input 
          type="number"
          value={formData.weight_grams}
          onChange={(e) => updateField('weight_grams', Number(e.target.value))}
          className="input-luxe w-full"
          placeholder="e.g. 150"
        />
      </div>
      
      <div>
        <label className="text-foreground/ text-xs uppercase tracking-wide mb-2 block">Dimensions (L × W × H) cm</label>
        <div className="grid grid-cols-3 gap-3">
          <input 
            type="number"
            value={formData.length_cm}
            onChange={(e) => updateField('length_cm', Number(e.target.value))}
            className="input-luxe w-full text-center"
            placeholder="L"
          />
          <input 
            type="number"
            value={formData.width_cm}
            onChange={(e) => updateField('width_cm', Number(e.target.value))}
            className="input-luxe w-full text-center"
            placeholder="W"
          />
          <input 
            type="number"
            value={formData.height_cm}
            onChange={(e) => updateField('height_cm', Number(e.target.value))}
            className="input-luxe w-full text-center"
            placeholder="H"
          />
        </div>
      </div>
    </div>
  );
}
