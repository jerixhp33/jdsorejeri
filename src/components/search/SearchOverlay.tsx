'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/store/useSearchStore';
import { SearchBar } from './SearchBar';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchResults } from './SearchResults';
import { NoResults } from './NoResults';

export function SearchOverlay() {
  const { isOpen, setOpen, query, results, isSearching } = useSearchStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      // Optional: Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-xl"
        >
          <div className="container mx-auto px-4 max-w-5xl h-full flex flex-col py-8">
            <SearchBar />
            
            <div className="flex-1 overflow-y-auto mt-8 pb-20 custom-scrollbar">
              {!query ? (
                <SearchSuggestions />
              ) : results.length > 0 ? (
                <SearchResults />
              ) : isSearching ? (
                <div className="flex items-center justify-center h-64">
                   <div className="w-8 h-8 rounded-full border-2 border-luxe-accent border-t-transparent animate-spin" />
                </div>
              ) : (
                <NoResults />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
