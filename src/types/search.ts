// src/types/search.ts
import type { Product } from './index';

export interface SearchIntent {
  keywords: string[];
  productType: 'all' | 'poster' | 'earring';
  sizes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  color?: string | null;
  brand?: string | null;
  gender?: string | null;
  category?: string | null;
  sort: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}

export interface SearchResult {
  product: Product;
  relevanceScore: number;
  matchType: 'exact' | 'prefix' | 'fuzzy' | 'category' | 'ai';
}

export interface SearchSuggestion {
  text: string;
  type: 'trending' | 'recent' | 'autocomplete' | 'category';
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  last_searched_at: string;
}

export interface SearchState {
  // UI State
  isOpen: boolean;
  query: string;
  isTyping: boolean;
  isSearching: boolean;
  isVoiceListening: boolean;

  // Data
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  history: SearchHistoryItem[];
  
  // Actions
  setOpen: (isOpen: boolean) => void;
  setQuery: (query: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsVoiceListening: (isListening: boolean) => void;
  
  setResults: (results: SearchResult[]) => void;
  setSuggestions: (suggestions: SearchSuggestion[]) => void;
  setHistory: (history: SearchHistoryItem[]) => void;
  
  clearSearch: () => void;
}
