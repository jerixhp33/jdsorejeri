'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, CheckCircle2, ChevronRight, Settings, Image as ImageIcon, Tag, LayoutTemplate, Star, Package, Settings2 } from 'lucide-react';
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
  short_description: z.string().optional(),
  brand: z.string().default('JD Store'),
  product_type: z.string().min(1),
  category_id: z.string().min(1, 'Select a category'),
  
  // Pricing
  original_price: z.preprocess(toOptionalNumber, z.number().optional()),
  cost_price: z.preprocess(toOptionalNumber, z.number().optional()),
  price: z.preprocess(toOptionalNumber, z.number().min(0, 'Selling Price is required').optional()),
  discount_percent: z.preprocess(toOptionalNumber, z.number().optional()),
  tax_percent: z.preprocess(toOptionalNumber, z.number().optional()),

  // Inventory & Shipping
  stock: z.preprocess(toOptionalNumber, z.number().min(0).optional()),
  low_stock_alert: z.preprocess(toOptionalNumber, z.number().optional()),
  continue_selling_oos: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'out_of_stock', 'archived']).default('active'),
  length_cm: z.preprocess(toOptionalNumber, z.number().optional()),
  width_cm: z.preprocess(toOptionalNumber, z.number().optional()),
  height_cm: z.preprocess(toOptionalNumber, z.number().optional()),
  weight_grams: z.preprocess(toOptionalNumber, z.number().optional()),
  courier_category: z.string().optional(),
  is_free_shipping: z.boolean().default(false),
  sku: z.string().optional(),

  // SEO & Marketing
  tags: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),

  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_limited_edition: z.boolean().default(false),
  slug: z.string().optional(),
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
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
  onSuccess?: () => void;
}

type TabKey = 'general' | 'pricing' | 'inventory' | 'specs' | 'images' | 'marketing';

export function ProductFormModal({ product, categories, onClose, onSaved, onSuccess }: ProductFormModalProps) {
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
      short_description: product?.short_description || '',
      brand: product?.brand || 'JD Store',
      product_type: product?.product_type || 'other',
      category_id: product?.category_id || '',
      tags: product?.tags?.join(', ') || '',
      
      original_price: product?.original_price,
      cost_price: product?.cost_price,
      price: product?.price,
      discount_percent: product?.discount_percent,
      tax_percent: product?.tax_percent,

      stock: product?.stock,
      low_stock_alert: product?.low_stock_alert || 5,
      continue_selling_oos: product?.continue_selling_oos ?? false,
      status: (product?.status as any) || 'active',
      length_cm: product?.length_cm,
      width_cm: product?.width_cm,
      height_cm: product?.height_cm,
      weight_grams: product?.weight_grams,
      courier_category: product?.courier_category || '',
      is_free_shipping: product?.is_free_shipping ?? false,
      sku: product?.sku || '',

      seo_title: product?.seo_title || '',
      seo_description: product?.seo_description || '',
      seo_keywords: product?.seo_keywords || '',

      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      is_trending: product?.is_trending ?? false,
      is_best_seller: product?.is_best_seller ?? false,
      is_new_arrival: product?.is_new_arrival ?? false,
      is_limited_edition: product?.is_limited_edition ?? false,
    },
  });

  const productType = watch('product_type');
  const selectedCategoryId = watch('category_id');
  const price = watch('price');
  const cost = watch('cost_price');

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

  const setAttr = (key: string, value: string) => {
    setAttributes(prev => {
      const next = { ...prev };
      if (value.trim() === '') delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.product_type]) acc[cat.product_type] = [];
    if (!acc[cat.product_type].find(c => c.id === cat.id)) acc[cat.product_type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

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
        return toast.error('Selling Price is required and must be greater than 0');
      }
    }

    if (images.length === 0) {
      setActiveTab('images');
      return toast.error('Please upload at least one image');
    }

    setSaving(true);
    try {
      const slug = data.slug || product?.slug || (generateSlug(data.name) + '-' + Math.random().toString(36).substring(2, 6));
      const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

      const payload = {
        ...data,
        slug,
        tags,
        attributes,
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

      await fetch('/api/admin/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: savedProduct.id,
          images: images.map((img, i) => {
            const payload: any = { url: img.url, storage_path: img.storage_path, display_order: i, is_primary: img.is_primary || false };
            if (img.id && img.id.length > 20 && !img.id.startsWith('temp-')) payload.id = img.id;
            return payload;
          }),
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
    { key: 'pricing', label: 'Pricing', icon: Tag },
    { key: 'inventory', label: 'Inventory & Shipping', icon: Package },
    { key: 'specs', label: 'Dynamic Specs', icon: Settings2 },
    { key: 'images', label: 'Media', icon: ImageIcon },
    { key: 'marketing', label: 'SEO & Marketing', icon: Settings },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <form 
        onSubmit={handleSubmit(onSubmit, () => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }))} 
        className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[85vh] grid grid-rows-[auto_auto_minmax(0,1fr)_auto] glass-card shadow-2xl overflow-hidden"
      >
        
        {/* Header (Row 1) */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-luxe-dark/90 backdrop-blur">
          <h2 className="text-white font-semibold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Row 2) */}
        <div className="flex items-center gap-2 p-4 border-b border-white/5 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            const hasError = isSubmitted && (
              (tab.key === 'general' && (errors.name || errors.description || errors.category_id)) ||
              (tab.key === 'pricing' && errors.price)
            );
            return (
              <button
                key={tab.key}
                type="button"
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

        {/* Scrollable Form Area (Row 3) */}
        <div ref={scrollContainerRef} className={cn("p-6 overscroll-contain", isCategoryOpen ? "overflow-hidden" : "overflow-y-auto")}>
          
          {/* GENERAL TAB */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'general' && 'hidden')}>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block flex justify-between">
                Category *
                {selectedCategoryId && <span className="text-luxe-accent flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Auto-mapped to type: {productType}</span>}
              </label>
              <div className="relative">
                <div 
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="input-luxe text-base py-3 flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {selectedCategoryId 
                      ? categories.find(c => c.id === selectedCategoryId)?.name 
                      : <span className="text-white/40">Select a product category to begin</span>}
                  </span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform text-white/40", isCategoryOpen && "rotate-90")} />
                </div>
                
                {isCategoryOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-luxe-black border border-white/10 rounded-xl shadow-2xl z-50 max-h-[300px] overflow-y-auto overscroll-contain">
                    {Object.entries(groupedCategories).map(([type, cats]) => (
                      <div key={type} className="p-2 border-b border-white/5 last:border-0">
                        <p className="text-[10px] uppercase tracking-widest text-luxe-accent font-semibold px-3 py-2">
                          {type.replace('_', ' ')}
                        </p>
                        <div className="space-y-1">
                          {cats.sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                            <div 
                              key={cat.id} 
                              onClick={() => {
                                setValue('category_id', cat.id, { shouldValidate: true });
                                setIsCategoryOpen(false);
                              }}
                              className={cn(
                                "px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                                selectedCategoryId === cat.id ? "bg-luxe-accent/20 text-luxe-accent" : "text-white/70 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {cat.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
            </div>

            {selectedCategoryId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Product Name *</label>
                  <input {...register('name')} className="input-luxe py-3" placeholder="Golden Statement Necklace" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Brand</label>
                  <input {...register('brand')} className="input-luxe py-3" placeholder="JD Store" />
                </div>
                <div className="col-span-2">
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Short Description</label>
                  <input {...register('short_description')} className="input-luxe py-3" placeholder="A brief one-liner summary..." />
                </div>
                <div className="col-span-2">
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Full Description * (Rich Text Ready)</label>
                  <textarea {...register('description')} className="input-luxe resize-none py-3" rows={6} placeholder="Craft an elegant description..." />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                </div>
              </div>
            )}
          </div>

          {/* PRICING TAB */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'pricing' && 'hidden')}>
            {!selectedCategoryId ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-white/30"><Tag className="w-12 h-12 mb-4 opacity-50" /><p>Select a category first.</p></div>
            ) : productType === 'poster' ? (
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/70 text-sm font-semibold">Poster Sizes & Pricing *</p>
                  <button type="button" onClick={addSize} className="btn-luxe-outline py-1.5 px-3 text-xs"><Plus className="w-3.5 h-3.5"/> Add Size</button>
                </div>
                <div className="flex gap-2">
                  {PRESET_SIZES.map((p) => (
                    <button key={p.label} type="button" onClick={() => addPreset(p)} className="px-3 py-1 rounded-lg text-xs border border-white/20 text-white/60 hover:text-white hover:border-luxe-accent transition-all">+ {p.label}</button>
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
            ) : (
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Selling Price (₹) *</label>
                  <input {...register('price', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3 text-lg font-medium text-luxe-accent" placeholder="499" />
                  {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Original Price (₹)</label>
                  <input {...register('original_price', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3" placeholder="699" />
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Cost Price (Admin Only)</label>
                  <input {...register('cost_price', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3" placeholder="200" />
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Tax (%)</label>
                  <input {...register('tax_percent', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3" placeholder="18" />
                </div>
                {price && cost ? (
                  <div className="col-span-2 p-4 rounded-xl bg-luxe-accent/10 border border-luxe-accent/20 flex justify-between items-center">
                    <span className="text-white/70 text-sm">Estimated Profit Margin:</span>
                    <span className="text-luxe-accent font-bold text-lg">₹{(price - cost).toFixed(2)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* INVENTORY & SHIPPING */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'inventory' && 'hidden')}>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Stock Quantity</label>
                <input {...register('stock', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3" placeholder="50" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Low Stock Alert</label>
                <input {...register('low_stock_alert', { valueAsNumber: true })} type="number" min="0" className="input-luxe py-3" placeholder="5" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Product Status</label>
                <select {...register('status')} className="input-luxe py-3">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">SKU (Auto-generates if blank)</label>
                <input {...register('sku')} className="input-luxe py-3" placeholder="E.g. RNG-SLV-01" />
              </div>
              
              <div className="col-span-2 border-t border-white/5 pt-4 mt-2"><h3 className="text-white/80 font-medium mb-4">Shipping Dimensions</h3></div>
              
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Weight (grams)</label>
                <input {...register('weight_grams', { valueAsNumber: true })} type="number" className="input-luxe" placeholder="150" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Courier Category</label>
                <input {...register('courier_category')} className="input-luxe" placeholder="Small Packet" />
              </div>
              <div className="grid grid-cols-3 gap-2 col-span-2">
                <div>
                  <label className="text-white/50 text-[10px] uppercase tracking-wide mb-1 block">Length (cm)</label>
                  <input {...register('length_cm', { valueAsNumber: true })} type="number" className="input-luxe" placeholder="10" />
                </div>
                <div>
                  <label className="text-white/50 text-[10px] uppercase tracking-wide mb-1 block">Width (cm)</label>
                  <input {...register('width_cm', { valueAsNumber: true })} type="number" className="input-luxe" placeholder="5" />
                </div>
                <div>
                  <label className="text-white/50 text-[10px] uppercase tracking-wide mb-1 block">Height (cm)</label>
                  <input {...register('height_cm', { valueAsNumber: true })} type="number" className="input-luxe" placeholder="2" />
                </div>
              </div>
              
              <div className="col-span-2 mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('continue_selling_oos')} className="w-5 h-5 accent-luxe-accent rounded" />
                  <span className="text-white/70 text-sm">Continue Selling When Out of Stock</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_free_shipping')} className="w-5 h-5 accent-luxe-accent rounded" />
                  <span className="text-white/70 text-sm">Free Shipping</span>
                </label>
              </div>
            </div>
          </div>

          {/* DYNAMIC SPECS */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'specs' && 'hidden')}>
            {!selectedCategoryId ? (
               <div className="h-full flex flex-col items-center justify-center text-center py-20 text-white/30"><Settings2 className="w-12 h-12 mb-4 opacity-50" /><p>Select a category first.</p></div>
            ) : (
              <>
                <div className="bg-luxe-accent/10 border border-luxe-accent/20 p-4 rounded-xl mb-6">
                  <p className="text-luxe-accent text-sm">Dynamic fields generated for <strong>{productType.toUpperCase()}</strong></p>
                </div>
                
                {/* DYNAMIC UI RENDERER */}
                <div className="grid grid-cols-2 gap-5 mb-6">
                  {productType === 'poster' && (
                    <>
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Orientation</label>
                        <select value={attributes['Orientation'] || ''} onChange={e => setAttr('Orientation', e.target.value)} className="input-luxe py-3">
                          <option value="">Select...</option>
                          <option value="Portrait">Portrait</option>
                          <option value="Landscape">Landscape</option>
                          <option value="Square">Square</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Paper Finish</label>
                        <select value={attributes['Finish'] || ''} onChange={e => setAttr('Finish', e.target.value)} className="input-luxe py-3">
                          <option value="">Select...</option>
                          <option value="Matte">Matte</option>
                          <option value="Glossy">Glossy</option>
                        </select>
                      </div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Frame Included</label><input className="input-luxe py-3" value={attributes['Frame'] || ''} onChange={e => setAttr('Frame', e.target.value)} placeholder="Yes / No" /></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Print Technology</label><input className="input-luxe py-3" value={attributes['Technology'] || ''} onChange={e => setAttr('Technology', e.target.value)} placeholder="Giclée Print" /></div>
                    </>
                  )}

                  {productType === 'earring' && (
                    <>
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Type</label>
                        <select value={attributes['Type'] || ''} onChange={e => setAttr('Type', e.target.value)} className="input-luxe py-3">
                          <option value="">Select...</option>
                          <option value="Stud">Stud</option><option value="Hoop">Hoop</option><option value="Drop">Drop</option><option value="Dangle">Dangle</option><option value="Jhumka">Jhumka</option>
                        </select>
                      </div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Material</label><input className="input-luxe py-3" value={attributes['Material'] || ''} onChange={e => setAttr('Material', e.target.value)} placeholder="Sterling Silver" /></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Closure Type</label><input className="input-luxe py-3" value={attributes['Closure'] || ''} onChange={e => setAttr('Closure', e.target.value)} placeholder="Push Back" /></div>
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Hypoallergenic</label>
                        <select value={attributes['Hypoallergenic'] || ''} onChange={e => setAttr('Hypoallergenic', e.target.value)} className="input-luxe py-3">
                          <option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option>
                        </select>
                      </div>
                    </>
                  )}

                  {productType === 'hairband' && (
                    <>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Material</label><input className="input-luxe py-3" value={attributes['Material'] || ''} onChange={e => setAttr('Material', e.target.value)} /></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Width</label><input className="input-luxe py-3" value={attributes['Width'] || ''} onChange={e => setAttr('Width', e.target.value)} /></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Stretchable</label><select value={attributes['Stretchable'] || ''} onChange={e => setAttr('Stretchable', e.target.value)} className="input-luxe py-3"><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Pattern</label><input className="input-luxe py-3" value={attributes['Pattern'] || ''} onChange={e => setAttr('Pattern', e.target.value)} /></div>
                    </>
                  )}

                  {productType === 'bracelet' && (
                    <>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Material</label><input className="input-luxe py-3" value={attributes['Material'] || ''} onChange={e => setAttr('Material', e.target.value)} /></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Adjustable</label><select value={attributes['Adjustable'] || ''} onChange={e => setAttr('Adjustable', e.target.value)} className="input-luxe py-3"><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Charm Included</label><input className="input-luxe py-3" value={attributes['Charm'] || ''} onChange={e => setAttr('Charm', e.target.value)} /></div>
                      <div><label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Unisex</label><select value={attributes['Unisex'] || ''} onChange={e => setAttr('Unisex', e.target.value)} className="input-luxe py-3"><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                    </>
                  )}
                </div>
                
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-white font-medium mb-4">Custom Attributes Builder</h3>
                  <p className="text-white/40 text-xs mb-4">Add any infinite combination of custom attributes below.</p>
                  <AttributesEditor attributes={attributes} onChange={setAttributes} />
                </div>
              </>
            )}
          </div>

          {/* IMAGES TAB */}
          <div className={cn("animate-in fade-in slide-in-from-bottom-2 h-full", activeTab !== 'images' && 'hidden')}>
            <p className="text-white/50 text-sm mb-4">
              Upload beautiful, high-quality images. Select the <Star className="inline w-4 h-4 text-luxe-accent"/> to choose the primary cover image.
            </p>
            <ImageUploader images={images} onChange={setImages} onDelete={handleImageDelete} maxImages={8} />
          </div>

          {/* SEO & MARKETING TAB */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2", activeTab !== 'marketing' && 'hidden')}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 flex justify-between">
                  <span>Product Slug</span>
                  <span className="text-white/30 text-[10px]">Auto-generates if blank</span>
                </label>
                <input {...register('slug')} className="input-luxe py-3" placeholder="custom-product-url-slug" />
                {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug.message}</p>}
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">SEO Title</label>
                <input {...register('seo_title')} className="input-luxe py-3" placeholder="Optimized title for Google" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">SEO Description</label>
                <textarea {...register('seo_description')} className="input-luxe py-3 resize-none" rows={3} placeholder="Meta description..." />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Search Keywords / Tags</label>
                <input {...register('tags')} className="input-luxe py-3" placeholder="minimal, gold, trending (comma separated)" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {[
                { name: 'is_active', label: 'Product Active', desc: 'Visible in the store' },
                { name: 'is_featured', label: 'Featured Product', desc: 'Show in Hero sections' },
                { name: 'is_best_seller', label: 'Best Seller', desc: 'Add Best Seller badge' },
                { name: 'is_new_arrival', label: 'New Arrival', desc: 'Add New Arrival badge' },
                { name: 'is_trending', label: 'Trending', desc: 'Add Trending badge' },
                { name: 'is_limited_edition', label: 'Limited Edition', desc: 'Add Limited badge' },
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

        {/* Footer Actions (Row 4) */}
        <div className="flex items-center justify-between p-5 border-t border-white/10 bg-black/20">
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
  );
}