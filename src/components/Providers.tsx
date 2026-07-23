'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    let channel: any;
    let supabaseClient: any;

    // Dynamically import supabase client to avoid SSR issues
    import('@/lib/supabase/client').then(async ({ createClient }) => {
      const supabase = createClient();
      supabaseClient = supabase;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Only subscribe if there's an authenticated user

      // Global Realtime Sync: Automatically invalidate caches when DB changes
      channel = supabase.channel('global-sync')
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
    });

    return () => {
      if (supabaseClient && channel) {
        supabaseClient.removeChannel(channel);
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
