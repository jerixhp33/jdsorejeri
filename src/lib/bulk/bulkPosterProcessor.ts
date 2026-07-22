import { UploadedImage } from '@/components/admin/ImageUploader';
import { generateBulkProductDataPrompt } from '../ai/prompts';
import { createBulkProduct, BulkProductPayload } from '../products/productCreator';
import { generateSlug } from '../utils';

import { createClient } from '@/lib/supabase/client';

export interface BulkPosterItem {
  id: string; // unique internal ID for the UI
  file?: File;
  previewUrl?: string;
  image?: UploadedImage;
  originalFilename: string;
  title: string;
  isGeneric: boolean;
  status: 'pending' | 'uploading' | 'generating_ai' | 'saving' | 'completed' | 'error';
  error?: string;
  
  // Edited/Generated data
  short_description?: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  tags?: string[];
  
  // Global settings assigned
  categoryId: string;
  productType: string;
  basePrice: number;
  costPrice: number;
  stock: number;
  sizes: { label: string; price: number; stock: number; sku?: string }[];
  attributes: Record<string, string>;
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
}

const uploadFile = (file: File): Promise<UploadedImage | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return reject(new Error("Unauthorized"));

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/product-images/${path}`;
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(path);
          resolve({ url: data.publicUrl, storage_path: path, is_primary: true });
        } else {
          reject(new Error("Upload failed: " + xhr.responseText));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    } catch (err: any) {
      reject(err);
    }
  });
};

// Simple concurrency queue runner
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e: Promise<void> = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export async function processBulkItems(
  items: BulkPosterItem[],
  onUpdate: (id: string, updates: Partial<BulkPosterItem>) => void
) {
  // Process up to 3 at a time to avoid rate limits
  return asyncPool(3, items, async (item) => {
    if (item.status === 'completed') return item;
    
    try {
      let uploadedImage = item.image;
      
      // 0. Upload image
      if (!uploadedImage && item.file) {
        onUpdate(item.id, { status: 'uploading' });
        const img = await uploadFile(item.file);
        if (!img) throw new Error("Image upload failed");
        uploadedImage = img;
        onUpdate(item.id, { image: uploadedImage });
      }

      // 1. AI Generation
      let description = item.short_description || '';
      let tags = item.tags || [];
      
      if (!description && !item.isGeneric) {
        onUpdate(item.id, { status: 'generating_ai' });
        
        const prompt = generateBulkProductDataPrompt(item.title, item.productType, "Poster");
        const res = await fetch('/api/admin/generate-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, type: 'bulk' })
        });
        
        if (res.ok) {
          const aiData = await res.json();
          let parsed;
          try {
             // AI might return markdown block ```json ... ```, strip it
             const aiText = aiData.result || aiData.text || '';
             let raw = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
             parsed = JSON.parse(raw);
             description = parsed.short_description || description;
             tags = parsed.tags || tags;
             
             // Update item with the rest of the parsed data
             item.description = parsed.description;
             item.seo_title = parsed.seo_title;
             item.seo_description = parsed.seo_description;
          } catch(e) {
             console.warn('Failed to parse AI JSON', aiData.result);
          }
        }
      }

      onUpdate(item.id, { 
        status: 'saving', 
        short_description: description, 
        description: item.description,
        seo_title: item.seo_title,
        seo_description: item.seo_description,
        tags 
      });

      // 2. Save Product
      const payload: BulkProductPayload = {
        name: item.title,
        slug: generateSlug(item.title) + '-' + Math.random().toString(36).substring(2, 6),
        short_description: description || 'Beautiful poster for your space.',
        product_type: item.productType as any,
        category_id: item.categoryId,
        tags: tags.length > 0 ? tags : ['Poster', 'Wall Art'],
        price: item.basePrice,
        cost_price: item.costPrice,
        stock: item.stock,
        status: 'active',
        images: uploadedImage ? [uploadedImage] : [],
        sizes: item.sizes,
        isFeatured: item.isFeatured,
        isTrending: item.isTrending,
        isBestSeller: item.isBestSeller,
        attributes: item.attributes
      };

      await createBulkProduct(payload);

      onUpdate(item.id, { status: 'completed' });
      return { ...item, status: 'completed' as const };
      
    } catch (err: any) {
      onUpdate(item.id, { status: 'error', error: err.message });
      return { ...item, status: 'error' as const, error: err.message };
    }
  });
}
