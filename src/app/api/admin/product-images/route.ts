import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

const BUCKET = 'product-images';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { product_id, images, deletedImageIds, deletedStoragePaths } = await req.json();

    // 1. Delete orphaned files from Supabase Storage
    if (deletedStoragePaths && deletedStoragePaths.length > 0) {
      const { error: storageError } = await admin.storage
        .from(BUCKET)
        .remove(deletedStoragePaths);
        
      if (storageError) {
        console.error('Failed to delete some storage files:', storageError);
        // We continue even if storage delete fails to ensure DB integrity
      }
    }

    // 2. Delete removed images from Database
    if (deletedImageIds && deletedImageIds.length > 0) {
      await admin.from('product_images')
        .delete()
        .in('id', deletedImageIds);
    }

    // 3. Upsert remaining images (handles both updates and inserts)
    if (images && images.length > 0) {
      // Get existing images for this product to prevent duplicate URLs on auto-save
      const { data: existing } = await admin.from('product_images').select('id, url').eq('product_id', product_id);
      
      for (const img of images) {
        const payload = { ...img, product_id };
        
        // If the frontend didn't provide an ID, see if we already have this URL in the DB
        if (!payload.id && existing) {
          const existingImg = existing.find(e => e.url === img.url);
          if (existingImg) {
            payload.id = existingImg.id;
          }
        }
        
        const { error: upsertError } = await admin.from('product_images').upsert(payload);
        if (upsertError) throw upsertError;
      }
    }
    // 4. Return the updated images
    const { data: updatedImages } = await admin.from('product_images').select('*').eq('product_id', product_id).order('display_order', { ascending: true });

    return NextResponse.json({ success: true, images: updatedImages });
  } catch (err: any) {
    console.error('Product images sync error:', err);
    return NextResponse.json({ error: err.message || 'Failed to sync images' }, { status: 500 });
  }
}
