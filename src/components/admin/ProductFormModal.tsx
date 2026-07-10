'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, CheckCircle2, ChevronRight, Settings, Image as ImageIcon, Tag, LayoutTemplate, Star } from 'lucide-react';
import { generateSlug, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUploader, type UploadedImage } from './ImageUploader';
import type { Product, Category } from '@/types';
import { AttributesEditor } from './AttributesEditor';

const toOptionalNumber = (val: unknown): number | undefined => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
};

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  product_type: z.enum(['poster', 'earring', 'hairband', 'bracelet', 'keychain', 'hair_clip', 'other']),
  category_id: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  material: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  finish: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), z.enum(['matte', 'glossy', 'satin', 'metallic']).optional()),
  orientation: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), z.enum(['portrait', 'landscape', 'square']).optional()),
  color: z.string().optional(),
  weight_grams: z.preprocess(toOptionalNumber, z.number().optional()),
  price: z.preprocess(toOptionalNumber, z.number().min(0).optional()),
  stock: z.preprocess(toOptionalNumber, z.number().min(0).optional()),
  sku: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface SizeRow {
  id?: string;
  label: string;
  width_cm: string;
  height_cm: string;
  price: string;
  stock: string;
  sku: string;
}

const DEFAULT_SIZE: SizeRow = { label: '', width_cm: '', height_cm: '', price: '', stock: '', sku: '' };
const PRESET_SIZES = [
  { label: 'A4', width_cm: '21', height_cm: '29.7' },
  { label: 'A3', width_cm: '29.7', height_cm: '42' },
  { label: 'A2', width_cm: '42', height_cm: '59.4' },
];

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}

type TabKey = 'general' | 'pricing' | 'images' | 'visibility';

export function ProductFormModal({ product, categories, onClose, onSaved }: ProductFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<UploadedImage[]>(
    product?.images?.map((i) => ({ 
      id: i.id,
      url: i.url,
      storage_path: (i as any).storage_path, 
      is_primary: i.is_primary 
    })) || []
  );
  
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deletedStoragePaths, setDeletedStoragePaths] = useState<string[]>([]);

  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.sizes && product.sizes.length > 0
      ? product.sizes.map((s) => ({
          id: s.id,
          label: s.label,
          width_cm: String(s.width_cm ?? ''),
          height_cm: String(s.height_cm ?? ''),
          price: String(s.price),
          stock: String(s.stock),
          sku: s.sku || '',
        }))
      : [{ ...DEFAULT_SIZE }]
  );

  const [attributes, setAttributes] = useState<Record<string, string>>(product?.attributes || {});

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitted } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      product_type: product?.product_type || 'other',
      category_id: product?.category_id || '',
      tags: product?.tags?.join(', ') || '',
      material: product?.material || '',
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      is_trending: product?.is_trending ?? false,
      is_best_seller: product?.is_best_seller ?? false,
      finish: product?.finish,
      orientation: product?.orientation,
      color: product?.color || '',
      weight_grams: product?.weight_grams,
      price: product?.price,
      stock: product?.stock,
      sku: product?.sku || '',
    },
  });

  const productType = watch('product_type');
  const selectedCategoryId = watch('category_id');

  // Smart Category Mapping
  useEffect(() => {
    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (cat) {
        setValue('product_type', cat.product_type, { shouldValidate: true });
      }
    }
  }, [selectedCategoryId, categories, setValue]);

  const updateSize = (i: number, field: keyof SizeRow, value: string) => setSizes(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const addSize = () => setSizes(prev => [...prev, { ...DEFAULT_SIZE }]);
  const removeSize = (i: number) => setSizes(prev => prev.filter((_, idx) => idx !== i));
  const addPreset = (preset: typeof PRESET_SIZES[0]) => {
    setSizes(prev => prev.some(s => s.label === preset.label) ? prev : [...prev, { ...DEFAULT_SIZE, label: preset.label, width_cm: preset.width_cm, height_cm: preset.height_cm }]);
  };

  const handleImageDelete = (img: UploadedImage) => {
    if (img.id) setDeletedImageIds(prev => [...prev, img.id!]);
    if (img.storage_path) setDeletedStoragePaths(prev => [...prev, img.storage_path!]);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (data.product_type === 'poster') {
      const validSizes = sizes.filter(s => s.label.trim());
      if (validSizes.length === 0) return toast.error('Add at least one size for the poster');
      for (const s of validSizes) {
        if (!s.price || Number(s.price) <= 0) return toast.error(`Size "${s.label}" needs a valid price`);
      }
    } else {
      if (!data.price || data.price <= 0) {
        setActiveTab('pricing');
        return toast.error('Price is required and must be greater than 0');
      }
    }

    if (images.length === 0) {
      setActiveTab('images');
      return toast.error('Please upload at least one image');
    }

    setSaving(true);
    try {
      const slug = product?.slug || generateSlug(data.name);
      const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

      const payload = {
        name: data.name,
        slug,
        description: data.description,
        product_type: data.product_type,
        category_id: data.category_id,
        tags,
        material: data.material || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        is_trending: data.is_trending,
        is_best_seller: data.is_best_seller,
        attributes,
        ...(data.product_type === 'poster' ? { finish: data.finish || null, orientation: data.orientation || null } : { color: data.color || null, weight_grams: data.weight_grams || null, price: data.price || null, stock: data.stock || null, sku: data.sku || null }),
        updated_at: new Date().toISOString(),
      };

      let savedProduct: Product;
      if (product) {
        const res = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, ...payload }) });
        if (!res.ok) throw new Error('Update failed');
        savedProduct = await res.json();
      } else {
        const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Creation failed');
        savedProduct = await res.json();
      }

      if (data.product_type === 'poster') {
        const validSizes = sizes.filter(s => s.label.trim());
        await fetch('/api/admin/poster-sizes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: savedProduct.id, sizes: validSizes.map(s => ({ label: s.label.trim(), width_cm: parseFloat(s.width_cm) || null, height_cm: parseFloat(s.height_cm) || null, price: parseFloat(s.price) || 0, stock: parseInt(s.stock) || 0, sku: s.sku.trim() || null, is_active: true })) }),
        });
      }

      // Smart Upsert for Images
      await fetch('/api/admin/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: savedProduct.id,
          images: images.map((img, i) => ({ id: img.id, url: img.url, storage_path: img.storage_path, display_order: i, is_primary: img.is_primary || false })),
          deletedImageIds,
          deletedStoragePaths,
        }),
      });

      toast.success(product ? 'Product saved beautifully' : 'Product created perfectly');
      onSaved(savedProduct);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'general', label: 'General Info', icon: LayoutTemplate },
    { key: 'pricing', label: 'Pricing & Specs', icon: Tag },
    { key: 'images', label: 'Media', icon: ImageIcon },
    { key: 'visibility', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div ref={scrollContainerRef} className="relative w-full max-w-3xl h-[85vh] flex flex-col glass-card overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-luxe-dark/90 backdrop-blur">
          <h2 className="text-white font-semibold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 flex items-center gap-2 p-4 border-b border-white/5 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            const hasError = isSubmitted && (
              (tab.key === 'general' && (errors.name || errors.description || errors.category_id)) ||
              (tab.key === 'pricing' && (errors.price || errors.stock))
            );
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  active ? "bg-luxe-accent text-luxe-black" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
                  hasError && !active ? "border border-red-500/50 text-red-400" : ""
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {hasError && <div className="w-2 h-2 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit(onSubmit, () => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }))} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* GENERAL TAB */}
            <div className={cn("space-y-5 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'general' && 'hidden')}>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block flex justify-between">
                  Category *
                  {selectedCategoryId && <span className="text-luxe-accent flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Auto-mapped</span>}
                </label>
                <select {...register('category_id')} className="input-luxe text-base py-3">
                  <option value="">Select a product category to begin</option>
                  {Object.entries(
                    categories.reduce((acc, cat) => {
                      if (!acc[cat.product_type]) acc[cat.product_type] = [];
                      if (!acc[cat.product_type].find(c => c.id === cat.id)) {
                        acc[cat.product_type].push(cat);
                      }
                      return acc;
                    }, {} as Record<string, Category[]>)
                  ).map(([type, cats]) => (
                    <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}>
                      {cats.sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
                {selectedCategoryId && <p className="text-white/30 text-xs mt-2">The form layout will perfectly adapt based on the category you chose.</p>}
              </div>

              {selectedCategoryId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                  <div className="col-span-2">
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Product Name *</label>
                    <input {...register('name')} className="input-luxe py-3" placeholder="Golden Statement Necklace" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Description *</label>
                    <textarea {...register('description')} className="input-luxe resize-none py-3" rows={4} placeholder="Craft an elegant description..." />
                    {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Primary Material</label>
                    <input {...register('material')} className="input-luxe" placeholder={productType !== 'poster' ? '18k Gold Plated' : '250gsm Premium Paper'} />
                  </div>
                </div>
              )}
            </div>

            {/* PRICING TAB */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'pricing' && 'hidden')}>
              {!selectedCategoryId ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-white/30">
                  <Tag className="w-12 h-12 mb-4 opacity-50" />
                  <p>Please select a category in the General tab first.</p>
                </div>
              ) : productType === 'poster' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Paper Finish</label>
                      <select {...register('finish')} className="input-luxe">
                        <option value="">Standard</option>
                        <option value="matte">Matte</option>
                        <option value="glossy">Glossy</option>
                        <option value="satin">Satin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Orientation</label>
                      <select {...register('orientation')} className="input-luxe">
                        <option value="">Auto</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-white/70 text-sm font-semibold">Poster Sizes & Pricing *</p>
                      <button type="button" onClick={addSize} className="btn-luxe-outline py-1.5 px-3 text-xs"><Plus className="w-3.5 h-3.5"/> Add Size</button>
                    </div>
                    <div className="flex gap-2">
                      {PRESET_SIZES.map((p) => (
                        <button key={p.label} type="button" onClick={() => addPreset(p)} className="px-3 py-1 rounded-lg text-xs border border-white/20 text-white/60 hover:text-white hover:border-luxe-accent transition-all">
                          + {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {sizes.map((size, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={size.label} onChange={e => updateSize(i, 'label', e.target.value)} className="input-luxe flex-[2] text-xs py-2" placeholder="Label (A4)" />
                          <input value={size.price} onChange={e => updateSize(i, 'price', e.target.value)} className="input-luxe flex-[2] text-xs py-2" type="number" placeholder="Price (₹)" />
                          <input value={size.stock} onChange={e => updateSize(i, 'stock', e.target.value)} className="input-luxe flex-[1.5] text-xs py-2" type="number" placeholder="Stock" />
                          <button type="button" onClick={() => removeSize(i)} disabled={sizes.length === 1} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-20"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Price (₹) *</label>
                      <input {...register('price', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3 text-lg font-medium" placeholder="499" />
                      {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Available Stock *</label>
                      <input {...register('stock', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3" placeholder="50" />
                      {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock.message}</p>}
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Color/Variant Name</label>
                      <input {...register('color')} className="input-luxe" placeholder="e.g. Gold" />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Weight (grams)</label>
                      <input {...register('weight_grams', { valueAsNumber: true })} type="number" step="0.1" className="input-luxe" placeholder="5.0" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Product SKU</label>
                      <input {...register('sku')} className="input-luxe text-white/50" placeholder="Leave blank to auto-generate" />
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-6">
                    <AttributesEditor attributes={attributes} onChange={setAttributes} />
                  </div>
                </div>
              )}
            </div>

            {/* IMAGES TAB */}
            <div className={cn("animate-in fade-in slide-in-from-bottom-2 h-full", activeTab !== 'images' && 'hidden')}>
              <p className="text-white/50 text-sm mb-4">
                Upload beautiful, high-quality images. Select the <Star className="inline w-4 h-4 text-luxe-accent"/> to choose the primary cover image.
              </p>
              <ImageUploader images={images} onChange={setImages} onDelete={handleImageDelete} maxImages={8} />
            </div>

            {/* VISIBILITY TAB */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'visibility' && 'hidden')}>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Tags (SEO & Search)</label>
                <input {...register('tags')} className="input-luxe py-3" placeholder="minimal, gold, trending (comma separated)" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                {[
                  { name: 'is_active', label: 'Product Active', desc: 'Visible in the store' },
                  { name: 'is_featured', label: 'Featured Product', desc: 'Show in Hero sections' },
                  { name: 'is_trending', label: 'Trending', desc: 'Add trending badge' },
                  { name: 'is_best_seller', label: 'Best Seller', desc: 'Add best seller badge' },
                ].map((flag) => (
                  <label key={flag.name} className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:border-white/30 transition-colors">
                    <input type="checkbox" {...register(flag.name as any)} className="w-5 h-5 mt-0.5 accent-luxe-accent rounded bg-black border-white/20" />
                    <div>
                      <p className="text-white font-medium text-sm">{flag.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{flag.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 flex items-center justify-between p-5 border-t border-white/10 bg-black/20">
            {isSubmitted && Object.keys(errors).length > 0 ? (
              <p className="text-red-400 text-sm font-medium">Please fix errors in previous tabs.</p>
            ) : <div />}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="btn-luxe-outline w-full sm:w-auto">Cancel</button>
              <button type="submit" disabled={saving} className="btn-gold w-full sm:w-auto flex items-center gap-2">
                {saving ? 'Saving...' : product ? 'Save Masterpiece' : 'Publish Product'} <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}