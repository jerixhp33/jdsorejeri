import { ProductType } from '@/types';
import { UploadedImage } from '@/components/admin/ImageUploader';

export interface BulkProductPayload {
  name: string;
  slug: string;
  short_description: string;
  product_type: ProductType | '';
  category_id: string;
  tags: string[];
  price: number;
  cost_price: number;
  stock: number;
  status: 'active' | 'draft';
  images: UploadedImage[];
  sizes: { label: string; price: number; stock: number; sku?: string }[];
}

export async function createBulkProduct(data: BulkProductPayload) {
  // 1. Create Product
  const productRes = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      slug: data.slug,
      short_description: data.short_description,
      description: data.short_description, // Default description to short_description initially
      product_type: data.product_type,
      category_id: data.category_id,
      tags: data.tags,
      price: data.price,
      original_price: data.price,
      cost_price: data.cost_price,
      stock: data.stock,
      sku: '',
      status: data.status,
      is_featured: false,
      is_trending: false,
      is_best_seller: false,
      attributes: {},
      weight_grams: 0,
      length_cm: 0,
      width_cm: 0,
      height_cm: 0,
      seo_title: data.name,
      seo_description: data.short_description,
      seo_keywords: data.tags.join(', '),
      created_at: new Date().toISOString()
    })
  });

  if (!productRes.ok) {
    const errorText = await productRes.text();
    throw new Error(`Failed to create product: ${errorText}`);
  }

  const savedProduct = await productRes.json();

  // 2. Create Poster Sizes
  if (data.sizes && data.sizes.length > 0) {
    const sizesRes = await fetch('/api/admin/poster-sizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: savedProduct.id,
        sizes: data.sizes.map(s => ({
          label: s.label,
          width_cm: null,
          height_cm: null,
          price: s.price,
          stock: s.stock,
          sku: s.sku || null,
          is_active: true
        }))
      })
    });
    if (!sizesRes.ok) {
       console.warn('Failed to save sizes for bulk product', savedProduct.id);
    }
  }

  // 3. Create Images
  if (data.images && data.images.length > 0) {
    const imgRes = await fetch('/api/admin/product-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: savedProduct.id,
        images: data.images.map((img, i) => ({
          url: img.url,
          storage_path: img.storage_path,
          display_order: i,
          is_primary: img.is_primary || i === 0
        })),
        deletedImageIds: [],
        deletedStoragePaths: []
      })
    });
    if (!imgRes.ok) {
       console.warn('Failed to save images for bulk product', savedProduct.id);
    }
  }

  return savedProduct;
}
