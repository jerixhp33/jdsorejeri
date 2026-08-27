import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: uploadId } = await params;
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

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

    const { data: upload, error: uploadErr } = await admin
      .from('custom_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (uploadErr || !upload) {
      return NextResponse.json({ error: 'Upload record not found' }, { status: 404 });
    }

    // Verify ownership if not admin
    if (!isAdmin && upload.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate signed URL (24 hours = 86400 seconds)
    const { data: signedData, error: signedErr } = await admin.storage
      .from('custom_user_uploads')
      .createSignedUrl(upload.storage_path, 86400);

    if (signedErr || !signedData) {
      console.error('Signed URL Error:', signedErr);
      return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 });
    }

    return NextResponse.redirect(signedData.signedUrl);
  } catch (error: any) {
    console.error('Custom Upload API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
