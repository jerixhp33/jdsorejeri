import { ProductFormData } from '../types';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  onGenerateShortDesc?: () => void;
  onGenerateFullDesc?: () => void;
  isGeneratingShortDesc?: boolean;
  isGeneratingFullDesc?: boolean;
}

export function DescriptionSection({ 
  formData, 
  updateField, 
  onGenerateShortDesc, 
  onGenerateFullDesc,
  isGeneratingShortDesc,
  isGeneratingFullDesc
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/50 text-xs uppercase tracking-wide block">Short Description</label>
          <div className="flex items-center gap-4">
            <span className="text-white/30 text-xs">{formData.short_description?.length || 0} / 150</span>
            <button 
              onClick={onGenerateShortDesc}
              disabled={isGeneratingShortDesc || !formData.name}
              className="text-luxe-accent text-xs font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {isGeneratingShortDesc ? 'Generating...' : '✨ Generate with AI'}
            </button>
          </div>
        </div>
        <textarea 
          value={formData.short_description}
          onChange={(e) => updateField('short_description', e.target.value)}
          className="input-luxe w-full min-h-[80px] resize-none"
          placeholder="Brief summary for product cards..."
          maxLength={150}
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/50 text-xs uppercase tracking-wide block">Full Description</label>
          <button 
            onClick={onGenerateFullDesc}
            disabled={isGeneratingFullDesc || !formData.name}
            className="text-luxe-accent text-xs font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            {isGeneratingFullDesc ? 'Generating...' : '✨ Generate with AI'}
          </button>
        </div>
        <textarea 
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="input-luxe w-full min-h-[200px]"
          placeholder="Detailed product description..."
        />
      </div>
    </div>
  );
}
