import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWebPushToUser, broadcastWebPush } from '@/lib/web-push-helper';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('uid', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, body, url, target_all, target_user_ids } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const pushPayload = {
      title,
      body,
      url: url || '/',
      icon: '/icon-192x192.png'
    };

    if (target_all) {
      // Send to all subscribed users
      await broadcastWebPush(pushPayload);
    } else if (target_user_ids && target_user_ids.length > 0) {
      // Send to specific users
      for (const targetId of target_user_ids) {
        // Send Web Push
        await sendWebPushToUser(targetId, pushPayload);
        
        // Add in-app notification
        await supabase.from('notifications').insert({
          user_id: targetId,
          title,
          message: body,
          type: 'alert',
          is_read: false
        });
      }
    } else {
      return NextResponse.json({ error: 'No target specified' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Notification sent successfully' });
  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
