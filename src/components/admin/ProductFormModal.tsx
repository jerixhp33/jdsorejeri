'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUploader, type UploadedImage } from './ImageUploader';
import type { Product, Category } from '@/types';

// Safely coerce a value to number, returning undefined for empty/null/undefined/NaN
const toOptionalNumber = (val: unknown): number | undefined => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
};

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  product_type: z.enum(['poster', 'earring']),
  category_id: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  material: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  // Poster specific
  finish: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.enum(['matte', 'glossy', 'satin', 'metallic']).optional()
  ),
  orientation: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.enum(['portrait', 'landscape', 'square']).optional()
  ),
  // Earring specific (optional — posters don't fill these)
  color: z.string().optional(),
  weight_grams: z.preprocess(toOptionalNumber, z.number().optional()),
  // price/stock are earring-only; posters use poster_sizes instead.
  // Using .optional() so Zod never errors when these are empty on poster forms.
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
  { label: 'A4',    width_cm: '21',  height_cm: '29.7' },
  { label: 'A3',    width_cm: '29.7',height_cm: '42'   },
  { label: 'A2',    width_cm: '42',  height_cm: '59.4' },
  { label: '12×18', width_cm: '30.5',height_cm: '45.7' },
  { label: '18×24', width_cm: '45.7',height_cm: '60.9' },
  { label: '24×36', width_cm: '60.9',height_cm: '91.4' },
];

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}

export function ProductFormModal({ product, categories, onClose, onSaved }: ProductFormModalProps) {
  const [saving, setSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Images state — unified UploadedImage objects (url + optional storage path)
  const [images, setImages] = useState<UploadedImage[]>(
    product?.images?.map((i) => ({ url: i.url })) || []
  );

  // Poster sizes state
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

  const { register, handleSubmit, watch, formState: { errors, isSubmitted } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      product_type: product?.product_type || 'poster',
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

  // Size row helpers
  const updateSize = (i: number, field: keyof SizeRow, value: string) => {
    setSizes(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };
  const addSize = () => setSizes(prev => [...prev, { ...DEFAULT_SIZE }]);
  const removeSize = (i: number) => setSizes(prev => prev.filter((_, idx) => idx !== i));
  const addPreset = (preset: typeof PRESET_SIZES[0]) => {
    setSizes(prev => {
      if (prev.some(s => s.label === preset.label)) return prev;
      return [...prev, { ...DEFAULT_SIZE, label: preset.label, width_cm: preset.width_cm, height_cm: preset.height_cm }];
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    // Validate poster sizes
    if (data.product_type === 'poster') {
      const validSizes = sizes.filter(s => s.label.trim());
      if (validSizes.length === 0) {
        toast.error('Add at least one size with a label for the poster');
        return;
      }
      for (const s of validSizes) {
        if (!s.price || Number(s.price) <= 0) {
          toast.error(`Size "${s.label}" needs a price greater than 0`);
          return;
        }
      }
    }
    // Validate earring price
    if (data.product_type === 'earring') {
      if (!data.price || data.price <= 0) {
        toast.error('Earring price is required and must be greater than 0');
        return;
      }
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
        ...(data.product_type === 'poster' ? {
          finish: data.finish || null,
          orientation: data.orientation || null,
        } : {
          color: data.color || null,
          weight_grams: data.weight_grams || null,
          price: data.price || null,
          stock: data.stock || null,
          sku: data.sku || null,
        }),
        updated_at: new Date().toISOString(),
      };

      let savedProduct: Product;

      if (product) {
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id, ...payload }),
        });
        if (!res.ok) throw new Error('Update failed');
        savedProduct = await res.json();
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Failed to create product');
        }
        savedProduct = await res.json();
      }

      // Save poster sizes
      if (data.product_type === 'poster') {
        const validSizes = sizes.filter(s => s.label.trim());
        await fetch('/api/admin/poster-sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: savedProduct.id,
            sizes: validSizes.map(s => ({
              label: s.label.trim(),
              width_cm: parseFloat(s.width_cm) || null,
              height_cm: parseFloat(s.height_cm) || null,
              price: parseFloat(s.price) || 0,
              stock: parseInt(s.stock) || 0,
              sku: s.sku.trim() || null,
              is_active: true,
            })),
          }),
        });
        savedProduct.sizes = validSizes as any;
      }

      // Upsert images (by URL — storage paths are only for management)
      if (images.length > 0) {
        if (product) {
          await fetch('/api/admin/product-images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: product.id }),
          });
        }
        const imageRows = images.map((img, i) => ({
          product_id: savedProduct.id,
          url: img.url,
          display_order: i,
          is_primary: i === 0,
        }));
        await fetch('/api/admin/product-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: imageRows }),
        });
        savedProduct.images = imageRows as any;
      }

      toast.success(product ? 'Product updated' : 'Product created');
      onSaved(savedProduct);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div ref={scrollContainerRef} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-luxe-dark/90 backdrop-blur">
          <h2 className="text-white font-semibold">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, () => {
            // Scroll to top so the user sees the field-level errors
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          })}
          className="p-5 space-y-5"
        >
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Product Name *</label>
              <input {...register('name')} className="input-luxe" placeholder="Product name" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Type *</label>
              <select {...register('product_type')} className="input-luxe">
                <option value="poster">Poster</option>
                <option value="earring">Earring</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Category *</label>
              <select {...register('category_id')} className="input-luxe">
                <option value="">Select category</option>
                {categories
                  .filter((c) => c.product_type === productType)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
              {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Description *</label>
              <textarea {...register('description')} className="input-luxe resize-none" rows={3} placeholder="Product description" />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Material</label>
              <input
                {...register('material')}
                className="input-luxe"
                placeholder={productType === 'earring' ? 'e.g. Gold-plated, Sterling Silver' : 'e.g. 250gsm paper'}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Tags (comma separated)</label>
              <input {...register('tags')} className="input-luxe" placeholder="minimal, abstract, nature" />
            </div>
          </div>

          {/* Poster-specific */}
          {productType === 'poster' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10">
                <p className="col-span-2 text-white/50 text-xs uppercase tracking-wide">Poster Details</p>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Finish</label>
                  <select {...register('finish')} className="input-luxe">
                    <option value="">Select finish</option>
                    <option value="matte">Matte</option>
                    <option value="glossy">Glossy</option>
                    <option value="satin">Satin</option>
                    <option value="metallic">Metallic</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Orientation</label>
                  <select {...register('orientation')} className="input-luxe">
                    <option value="">Select orientation</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>

              {/* Poster Sizes */}
              <div className="p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-xs uppercase tracking-wide">Sizes, Pricing & Stock *</p>
                  <button
                    type="button"
                    onClick={addSize}
                    className="flex items-center gap-1 text-xs text-luxe-accent hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Size
                  </button>
                </div>

                <div>
                  <p className="text-white/30 text-xs mb-2">Quick add preset:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SIZES.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => addPreset(p)}
                        disabled={sizes.some(s => s.label === p.label)}
                        className="px-2.5 py-1 rounded-lg text-xs border border-white/10 text-white/50 hover:border-luxe-accent/50 hover:text-luxe-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 text-white/30 text-[10px] uppercase tracking-wide px-1">
                  <span className="col-span-2">Label</span>
                  <span className="col-span-2">W (cm)</span>
                  <span className="col-span-2">H (cm)</span>
                  <span className="col-span-2">Price ₹ *</span>
                  <span className="col-span-2">Stock *</span>
                  <span className="col-span-1">SKU</span>
                  <span className="col-span-1"></span>
                </div>

                {sizes.map((size, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={size.label} onChange={e => updateSize(i, 'label', e.target.value)} className="col-span-2 input-luxe text-xs py-2 px-2" placeholder="A4" />
                    <input value={size.width_cm} onChange={e => updateSize(i, 'width_cm', e.target.value)} className="col-span-2 input-luxe text-xs py-2 px-2" type="number" step="0.1" placeholder="21" />
                    <input value={size.height_cm} onChange={e => updateSize(i, 'height_cm', e.target.value)} className="col-span-2 input-luxe text-xs py-2 px-2" type="number" step="0.1" placeholder="29.7" />
                    <input value={size.price} onChange={e => updateSize(i, 'price', e.target.value)} className="col-span-2 input-luxe text-xs py-2 px-2" type="number" min="0" step="1" placeholder="499" />
                    <input value={size.stock} onChange={e => updateSize(i, 'stock', e.target.value)} className="col-span-2 input-luxe text-xs py-2 px-2" type="number" min="0" step="1" placeholder="50" />
                    <input value={size.sku} onChange={e => updateSize(i, 'sku', e.target.value)} className="col-span-1 input-luxe text-xs py-2 px-2" placeholder="auto" />
                    <button type="button" onClick={() => removeSize(i)} disabled={sizes.length === 1} className="col-span-1 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <p className="text-white/20 text-xs">Each size can have its own price and stock. Label is what customers see (e.g. A4, A3).</p>
              </div>
            </>
          )}

          {/* Earring-specific */}
          {productType === 'earring' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10">
              <p className="col-span-2 text-white/50 text-xs uppercase tracking-wide">Earring Details</p>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Price (₹) *</label>
                <input {...register('price', { valueAsNumber: true })} type="number" min="0" className="input-luxe" placeholder="499" />
                {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Stock *</label>
                <input {...register('stock', { valueAsNumber: true })} type="number" min="0" className="input-luxe" placeholder="50" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Color</label>
                <input {...register('color')} className="input-luxe" placeholder="e.g. Gold, Silver" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Weight (grams)</label>
                <input {...register('weight_grams', { valueAsNumber: true })} type="number" step="0.1" className="input-luxe" placeholder="5.0" />
              </div>
              <div className="col-span-2">
                <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">SKU</label>
                <input {...register('sku')} className="input-luxe" placeholder="Leave blank to auto-generate" />
              </div>
            </div>
          )}

          {/* Images — drag-and-drop uploader */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">
              Product Images
            </label>
            <ImageUploader images={images} onChange={setImages} maxImages={8} />
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'is_active', label: 'Active' },
              { name: 'is_featured', label: 'Featured' },
              { name: 'is_trending', label: 'Trending' },
              { name: 'is_best_seller', label: 'Best Seller' },
            ].map((flag) => (
              <label key={flag.name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(flag.name as any)}
                  className="w-4 h-4 accent-luxe-accent"
                />
                <span className="text-white/60 text-sm">{flag.label}</span>
              </label>
            ))}
          </div>

          {/* Validation error summary — shown after first submit attempt */}
          {isSubmitted && Object.keys(errors).length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <p className="font-medium mb-1">Please fix the following:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {errors.name && <li>{errors.name.message || 'Product name is required (min 2 characters)'}</li>}
                {errors.description && <li>{errors.description.message || 'Description is required (min 10 characters)'}</li>}
                {errors.category_id && <li>{errors.category_id.message || 'Please select a category'}</li>}
                {errors.product_type && <li>{errors.product_type.message || 'Product type is required'}</li>}
                {errors.price && <li>{errors.price.message || 'Price is required and must be greater than 0'}</li>}
                {errors.stock && <li>{errors.stock.message || 'Stock cannot be negative'}</li>}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-luxe-outline flex-1 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-gold flex-1 text-sm">
              {saving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}