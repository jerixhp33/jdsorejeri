'use client';

import { useEffect, useRef } from 'react';
import { useWebPush } from '@/hooks/useWebPush';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, subscribe } = useWebPush();
  const { user } = useAuth();
  const promptedRef = useRef(false);

  useEffect(() => {
    // Only prompt after login
    if (!user || !isSupported || isSubscribed || promptedRef.current) return;

    // Only prompt if they haven't explicitly denied or granted permission yet
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'default') return;
    }

    // Check if user dismissed it in this session or previously
    const isDismissed = localStorage.getItem('push-prompt-dismissed');
    if (isDismissed) return;

    promptedRef.current = true;

    // Delay the prompt slightly so it doesn't collide with the welcome toast
    const timer = setTimeout(() => {
      toast('Stay Updated ✦', {
        description: 'Enable notifications for order updates and exclusive offers.',
        duration: 15000,
        position: 'bottom-center',
        action: {
          label: 'Allow',
          onClick: async () => {
            try {
              const success = await subscribe();
              if (success) {
                toast.success('Notifications enabled successfully!');
              } else {
                localStorage.setItem('push-prompt-dismissed', 'true');
              }
            } catch (error) {
              console.error('Failed to subscribe:', error);
              localStorage.setItem('push-prompt-dismissed', 'true');
            }
          }
        },
        onDismiss: () => {
          localStorage.setItem('push-prompt-dismissed', 'true');
        }
      });
    }, 4500);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, subscribe]);

  return null;
}
