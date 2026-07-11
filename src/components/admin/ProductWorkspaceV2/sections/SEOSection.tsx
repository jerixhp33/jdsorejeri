import { ProductFormData } from '../types';

interface Props {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  onGenerateSEO?: () => void;
  isGeneratingSEO?: boolean;
}

export function SEOSection({ formData, updateField, onGenerateSEO, isGeneratingSEO }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/50 text-xs uppercase tracking-wide block">SEO Title</label>
          <div className="flex items-center gap-4">
            <span className="text-white/30 text-xs">{formData.seo_title?.length || 0} / 60</span>
            <button 
              onClick={onGenerateSEO}
              disabled={isGeneratingSEO || !formData.name}
              className="text-luxe-accent text-xs font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {isGeneratingSEO ? 'Generating...' : '✨ Generate SEO with AI'}
            </button>
          </div>
        </div>
        <input 
          type="text"
          value={formData.seo_title}
          onChange={(e) => updateField('seo_title', e.target.value)}
          className="input-luxe w-full"
          placeholder="Optimized title for search engines"
          maxLength={60}
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/50 text-xs uppercase tracking-wide block">SEO Description</label>
          <span className="text-white/30 text-xs">{formData.seo_description?.length || 0} / 160</span>
        </div>
        <textarea 
          value={formData.seo_description}
          onChange={(e) => updateField('seo_description', e.target.value)}
          className="input-luxe w-full min-h-[80px] resize-none"
          placeholder="Meta description..."
          maxLength={160}
        />
      </div>

      <div>
        <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Keywords</label>
        <input 
          type="text"
          value={formData.seo_keywords}
          onChange={(e) => updateField('seo_keywords', e.target.value)}
          className="input-luxe w-full"
          placeholder="e.g. buy earrings online, luxury jewelry"
        />
      </div>

      {/* Google Preview */}
      {(formData.seo_title || formData.name) && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-wide mb-3">Search Engine Preview</p>
          <div className="space-y-1">
            <p className="text-sm text-[#8ab4f8] truncate cursor-pointer hover:underline">
              {formData.seo_title || formData.name} - JD Store
            </p>
            <p className="text-xs text-[#006621] truncate">
              https://jdstore.in/product/{formData.slug || 'product-slug'}
            </p>
            <p className="text-xs text-[#80868b] line-clamp-2 leading-relaxed">
              {formData.seo_description || formData.short_description || 'No description provided. Search engines will automatically generate a snippet based on page content.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
