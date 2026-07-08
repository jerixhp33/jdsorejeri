'use client';

import { useSearchStore } from '@/store/useSearchStore';
import { SearchX } from 'lucide-react';
import { motion } from 'framer-motion';

export function NoResults() {
  const { query, setQuery } = useSearchStore();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-20"
    >
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
        <SearchX className="w-8 h-8 text-white/20" />
      </div>
      
      <h3 className="text-white text-xl font-medium mb-3">No results found for &quot;{query}&quot;</h3>
      <p className="text-white/40 text-sm max-w-md mb-8">
        We couldn&apos;t find anything matching your search. Try adjusting your keywords or browse our popular categories.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {['Posters', 'Earrings', 'Abstract', 'Gold'].map(cat => (
          <button
            key={cat}
            onClick={() => setQuery(cat)}
            className="px-6 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-luxe-accent hover:bg-luxe-accent/10 transition-all text-sm"
          >
            {cat}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
