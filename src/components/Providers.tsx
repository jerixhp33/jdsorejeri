'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, useRef } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const channelRef = useRef<any>(null);
  const supabaseRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    import('@/lib/supabase/client').then(async ({ createClient }) => {
      if (isCancelled) return;
      const supabase = createClient();
      supabaseRef.current = supabase;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session || isCancelled) return;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel('global-app-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        })
        .subscribe();

      channelRef.current = channel;
    });

    return () => {
      isCancelled = true;
      if (supabaseRef.current && channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
