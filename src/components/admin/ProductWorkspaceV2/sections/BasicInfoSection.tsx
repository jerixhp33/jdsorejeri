import { ProductFormData } from '../types';
import { Category } from '@/types';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  onGenerateTags?: () => void;
  isGeneratingTags?: boolean;
  categories: Category[];
}

export function BasicInfoSection({ formData, updateField, onGenerateTags, isGeneratingTags, categories }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Product Name *</label>
        <input 
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="input-luxe w-full"
          placeholder="e.g. Golden Butterfly Earrings"
        />
      </div>
      
      <div>
        <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">URL Slug</label>
        <input 
          type="text"
          value={formData.slug}
          onChange={(e) => updateField('slug', e.target.value)}
          className="input-luxe w-full text-white/50"
          placeholder="golden-butterfly-earrings"
        />
        <p className="text-white/30 text-xs mt-1">Leave empty to auto-generate from name.</p>
      </div>
      
      <div>
        <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Product Type</label>
        <select 
          value={formData.product_type}
          onChange={(e) => updateField('product_type', e.target.value as any)}
          className="input-luxe w-full capitalize"
        >
          <option value="">Select Type...</option>
          {Array.from(new Set(categories.map(c => c.product_type).filter(Boolean))).sort().map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
          {!categories.some(c => c.product_type === 'other') && <option value="other">Other</option>}
        </select>
      </div>

      <div>
        <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Category *</label>
        <select 
          value={formData.category_id}
          onChange={(e) => updateField('category_id', e.target.value)}
          className="input-luxe w-full"
        >
          <option value="">Select Category...</option>
          {categories
            .filter(cat => !formData.product_type || cat.product_type === formData.product_type)
            .map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))
          }
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/50 text-xs uppercase tracking-wide block">Tags</label>
          <button 
            onClick={onGenerateTags}
            disabled={isGeneratingTags || !formData.name}
            className="text-luxe-accent text-xs font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            {isGeneratingTags ? 'Generating...' : '✨ Generate with AI'}
          </button>
        </div>
        <input 
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => updateField('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="input-luxe w-full"
          placeholder="Comma separated (e.g. luxury, gold, gift)"
        />
      </div>
    </div>
  );
}
