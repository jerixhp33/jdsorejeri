import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uploadId: string }> }) {
  try {
    const { uploadId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await createAdminClient();
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('uid', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }


    const { data: upload, error: uploadErr } = await admin
      .from('custom_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (uploadErr || !upload) {
      return NextResponse.json({ error: 'Upload record not found' }, { status: 404 });
    }

    // Log VIEWED in custom_image_audit_logs
    await admin.from('custom_image_audit_logs').insert({
      admin_user_id: user.id,
      custom_upload_id: uploadId,
      action: 'VIEWED',
      metadata: {
        user_agent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    });

    // Generate signed URL (1 hour)
    const { data: signedData, error: signedErr } = await admin.storage
      .from('custom_user_uploads')
      .createSignedUrl(upload.storage_path, 3600);

    if (signedErr || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate signed view URL' }, { status: 500 });
    }

    return NextResponse.json({
      upload,
      signedUrl: signedData.signedUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
