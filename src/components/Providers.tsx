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
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    // Dynamically import supabase client to avoid SSR issues
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();

      // Global Realtime Sync: Automatically invalidate caches when DB changes
      const channel = supabase.channel('global-sync')
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

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
