'use client';

import { useSearchStore } from '@/store/useSearchStore';
import { motion } from 'framer-motion';
import { ProductCard } from '../product/ProductCard';
import { Sparkles } from 'lucide-react';

export function SearchResults() {
  const { results, isAIParsing } = useSearchStore();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white/60 font-medium tracking-wide">
          {results.length} {results.length === 1 ? 'Result' : 'Results'} Found
        </h3>
        {isAIParsing && (
          <div className="flex items-center gap-2 text-luxe-accent text-xs">
            <Sparkles className="w-3 h-3 animate-pulse" />
            AI filtering...
          </div>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {results.map((result, i) => (
          <ProductCard 
            key={result.product.id} 
            product={result.product as any} 
            index={i} 
          />
        ))}
      </motion.div>
    </div>
  );
}
