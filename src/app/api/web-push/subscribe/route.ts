import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import webpush from '@/lib/web-push';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Use admin client to bypass any table-level permission or RLS issues
    const admin = await createAdminClient();

    // Insert or update subscription
    const { error } = await admin
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }, { onConflict: 'user_id, endpoint' });

    if (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }

    // Send a welcome message immediately upon successful subscription
    try {
      let customerName = 'Valued Customer';
      const { data: profile } = await admin
        .from('user_profiles')
        .select('name')
        .eq('uid', user.id)
        .single();
      if (profile?.name) customerName = profile.name;

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: `Welcome to JD Store, ${customerName}! 🎉`,
          body: 'Your notifications are successfully set up! You will receive updates about your orders.',
          url: '/dashboard'
        })
      );
    } catch (pushErr) {
      console.error('Failed to send welcome push notification:', pushErr);
      // We don't fail the request if the welcome push fails, as long as it was saved
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
