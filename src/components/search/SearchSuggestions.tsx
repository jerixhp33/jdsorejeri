'use client';

import { useSearchStore } from '@/store/useSearchStore';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, ArrowRight } from 'lucide-react';

const TRENDING_SEARCHES = [
  'minimalist posters',
  'gold earrings under 500',
  'marvel wall art',
  'abstract paintings',
  'A4 size posters',
];

export function SearchSuggestions() {
  const { setQuery } = useSearchStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-12"
    >
      {/* Trending Searches */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-luxe-accent" />
          <h3 className="text-white font-medium text-lg tracking-wide">Trending Right Now</h3>
        </div>
        
        <div className="flex flex-col gap-2">
          {TRENDING_SEARCHES.map((term, i) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-white/20 font-mono text-sm">0{i + 1}</span>
                <span className="text-white/60 group-hover:text-white transition-colors">{term}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/0 group-hover:text-white/40 -translate-x-4 group-hover:translate-x-0 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Categories / Collections */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-luxe-accent" />
          <h3 className="text-white font-medium text-lg tracking-wide">Popular Categories</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {['Typography', 'Anime', 'Vintage', 'Silver', 'Studs', 'Drops', 'Oversized', 'Premium'].map((cat) => (
            <button
              key={cat}
              onClick={() => setQuery(cat)}
              className="px-5 py-2.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-luxe-accent hover:bg-luxe-accent/10 transition-all text-sm tracking-wide"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
