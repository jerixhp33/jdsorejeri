import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeImageQuality } from '@/lib/image-quality';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string | null;
    const width = Number(formData.get('width')) || 3000;
    const height = Number(formData.get('height')) || 4000;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 1. Check if bucket 'custom_user_uploads' exists, if not create it
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'custom_user_uploads' || b.id === 'custom_user_uploads');
    
    if (!bucketExists) {
      console.log('📦 Bucket custom_user_uploads not found. Creating private bucket...');
      await admin.storage.createBucket('custom_user_uploads', {
        public: false,
        fileSizeLimit: 25 * 1024 * 1024
      });
    }

    // 2. Read array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadId = crypto.randomUUID();
    const userFolder = userId && userId !== 'null' ? userId : 'guest';
    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `private/${userFolder}/${uploadId}/original.${fileExt}`;

    // 3. Upload file to storage
    const { error: uploadErr } = await admin.storage
      .from('custom_user_uploads')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return NextResponse.json({ error: `Storage error: ${uploadErr.message}` }, { status: 500 });
    }

    const analysis = analyzeImageQuality(width, height, file.size);

    // 4. Insert DB record into custom_uploads
    const { data: record, error: dbErr } = await admin
      .from('custom_uploads')
      .insert({
        id: uploadId,
        user_id: userId && userId !== 'null' ? userId : null,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type || 'image/jpeg',
        file_size: file.size,
        width,
        height,
        aspect_ratio: analysis.aspectRatioNum,
        quality_status: analysis.overallStatus,
        quality_score: Math.round(analysis.sizeRatings.A4.dpi)
      })
      .select('*')
      .single();

    if (dbErr) {
      console.error('DB record insert error:', dbErr);
      return NextResponse.json({ error: `DB error: ${dbErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      record: { ...record, analysis },
      analysis
    });
  } catch (err: any) {
    console.error('Custom poster upload failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
