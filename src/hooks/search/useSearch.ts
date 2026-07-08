import { useEffect, useRef } from 'react';
import { useSearchStore } from '@/store/useSearchStore';
import { useDebounce } from './useDebounce';

export function useSearch() {
  const store = useSearchStore();
  const debouncedQuery = useDebounce(store.query, 300);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        store.setResults([]);
        store.setIsSearching(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        store.setIsSearching(true);
        
        const startTime = Date.now();

        // 1. Fetch from Supabase via API directly (Fast path)
        const execRes = await fetch('/api/search/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: debouncedQuery }),
          signal
        });
        
        if (!execRes.ok) throw new Error('Failed to execute search');
        const results = await execRes.json();
        const dbMs = Date.now() - startTime;
        
        if (signal.aborted) return;
        store.setResults(results);

        // 2. Log Analytics (Fire and forget)
        fetch('/api/search/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'log',
            query: debouncedQuery,
            resultsCount: results.length,
            aiProcessingMs: dbMs
          })
        }).catch(() => {});

      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Search error:', error);
        store.setResults([]);
      } finally {
        if (!signal.aborted) {
          store.setIsSearching(false);
        }
      }
    }

    performSearch();
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...store
  };
}
