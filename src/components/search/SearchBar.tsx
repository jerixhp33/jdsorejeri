'use client';

import { useEffect, useRef } from 'react';
import { useSearchStore } from '@/store/useSearchStore';
import { useVoiceSearch } from '@/hooks/search/useVoiceSearch';
import { useSearch } from '@/hooks/search/useSearch';
import { Search, X, Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function SearchBar() {
  const { query, setQuery, setOpen } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize the orchestrator hook
  useSearch();

  const { isListening, startListening, stopListening, supported } = useVoiceSearch((text) => {
    setQuery(text);
  });

  useEffect(() => {
    // Auto-focus input when opened
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-luxe-accent/20 to-transparent rounded-2xl blur-xl transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
      
      <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden transition-all duration-300 focus-within:border-luxe-accent/50 focus-within:bg-[#151515]">
        
        {/* Search Icon */}
        <div className="pl-4 pr-2 flex items-center justify-center text-white/40">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, colors, prices..."
          className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder:text-white/20 placeholder:font-light py-4 px-2"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pr-2">
          {supported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
              title="Voice Search"
            >
              {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-3 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
              title="Clear"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-[1px] h-8 bg-white/10 mx-2" />
          
          <button
            onClick={() => setOpen(false)}
            className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white px-4 py-3 hover:bg-white/5 rounded-xl transition-all"
          >
            Esc
          </button>
        </div>
      </div>
      
    </div>
  );
}
