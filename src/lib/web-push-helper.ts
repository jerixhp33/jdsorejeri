import webpush from './web-push';
import { createClient } from '@supabase/supabase-js';

// Initialize a server-side Supabase client for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendWebPushToUser(userId: string, payload: { title: string; body: string; url?: string; image?: string; icon?: string }) {
  try {
    // The userId passed from orders is usually the profile.id, but push_subscriptions uses profile.uid
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('uid')
      .eq('id', userId)
      .single();

    const targetUid = profile ? profile.uid : userId;

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUid);

    if (error) {
      console.error('Error fetching subscriptions for push:', error);
    }
    
    console.log(`Found ${subscriptions?.length || 0} push subscriptions for user ${userId}`);

    if (!subscriptions || subscriptions.length === 0) return;

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/',
            image: payload.image,
            icon: payload.icon
          })
        );
      } catch (err: any) {
        // If the subscription is gone/expired (410), delete it from our DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Error sending push to endpoint:', sub.endpoint, err);
        }
      }
    });

    await Promise.allSettled(pushPromises);
  } catch (error) {
    console.error('Error in sendWebPushToUser:', error);
  }
}

export async function broadcastWebPush(payload: { title: string; body: string; url?: string }) {
  try {
    // Note: for very large user bases, this should be paginated or sent to a queue
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (!subscriptions || subscriptions.length === 0) return;

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/',
            image: payload.image,
            icon: payload.icon
          })
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.allSettled(pushPromises);
  } catch (error) {
    console.error('Error in broadcastWebPush:', error);
  }
}
