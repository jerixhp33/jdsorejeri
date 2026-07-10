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
      const { error: upsertError } = await admin.from('product_images').upsert(
        images.map((img: any) => ({
          ...img,
          product_id, // ensure product_id is correctly mapped
        }))
      );
      if (upsertError) throw upsertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Product images sync error:', err);
    return NextResponse.json({ error: err.message || 'Failed to sync images' }, { status: 500 });
  }
}
