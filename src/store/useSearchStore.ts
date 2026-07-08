import { create } from 'zustand';
import type { SearchState, SearchResult, SearchSuggestion, SearchHistoryItem } from '@/types/search';

export const useSearchStore = create<SearchState>((set) => ({
  // UI State
  isOpen: false,
  query: '',
  isTyping: false,
  isSearching: false,
  isVoiceListening: false,

  // Data
  results: [],
  suggestions: [],
  history: [],

  // Actions
  setOpen: (isOpen) => set({ isOpen }),
  setQuery: (query) => set({ query }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setIsVoiceListening: (isVoiceListening) => set({ isVoiceListening }),

  setResults: (results) => set({ results }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setHistory: (history) => set({ history }),

  clearSearch: () => set({ 
    query: '', 
    results: [], 
    suggestions: [], 
    isSearching: false,
  }),
}));
