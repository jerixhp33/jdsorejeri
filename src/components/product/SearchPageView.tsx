'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import Link from 'next/link';
import type { Product, Category } from '@/types';

interface SearchPageViewProps {
  initialQuery: string;
}

type SortOption = 'featured' | 'newest' | 'price_asc' | 'price_desc';

export function SearchPageView({ initialQuery }: SearchPageViewProps) {
  const router = useRouter();
  
  // Search State
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  
  // Filter State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch categories for filters
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, [supabase]);

  const doSearch = async (
    q: string = query, 
    type: string = selectedType,
    cats: string[] = selectedCategories,
    minP: string = minPrice,
    maxP: string = maxPrice,
    sort: SortOption = sortBy
  ) => {
    // We can search even without a query if filters are applied
    if (!q.trim() && type === 'all' && cats.length === 0 && !minP && !maxP) {
      setProducts([]);
      setHasSearched(false);
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    let dbQuery: any;

    let searchType = type;
    let words: string[] = [];
    let sizeFilter = '';
    
    // We will build the select string based on whether we need an inner join on sizes
    let selectStr = '*, category:product_categories(*), images:product_images(*)';

    // 1. Text Search & Natural Language Parsing (AI-Powered)
    if (q.trim()) {
      try {
        // Call the Groq AI Intent Parser
        const res = await fetch('/api/search/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q.trim() }),
        });
        
        if (!res.ok) throw new Error("AI parser failed");
        const aiIntent = await res.json();
        
        words = aiIntent.keywords || [];
        if (aiIntent.productType && aiIntent.productType !== 'all') {
          searchType = aiIntent.productType;
        }
        // AI can also detect price ranges automatically!
        if (aiIntent.minPrice !== undefined && aiIntent.minPrice !== null) {
          minP = aiIntent.minPrice.toString();
        }
        if (aiIntent.maxPrice !== undefined && aiIntent.maxPrice !== null) {
          maxP = aiIntent.maxPrice.toString();
        }

        if (aiIntent.sizes && aiIntent.sizes.length > 0) {
          sizeFilter = aiIntent.sizes[0];
          searchType = 'poster';
        }

        if (sizeFilter) {
          selectStr += ', sizes!inner(*)';
        } else {
          selectStr += ', sizes:poster_sizes(*)';
        }

        dbQuery = supabase.from('products').select(selectStr).eq('is_active', true);

        if (sizeFilter) {
          dbQuery = dbQuery.ilike('sizes.label', `%${sizeFilter}%`);
        }

        if (words.length > 0) {
          const orConditions = words.map((w: string) => `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`).join(',');
          dbQuery = dbQuery.or(orConditions);
        } else if (searchType === 'all' && words.length === 0) {
           // Fallback if AI didn't find any keywords but query exists
           dbQuery = dbQuery.or(`name.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`);
        }
      } catch (error) {
        console.error("Using fallback parser:", error);
        // Fallback to simple parser
        let qText = q.trim().toLowerCase();
        if (qText.endsWith('s') && qText.length > 3) qText = qText.slice(0, -1);
        words = qText.split(/\s+/).filter(w => w.length > 2);
        
        ['poster', 'earring'].forEach(t => {
          if (words.includes(t)) {
            searchType = t;
            words = words.filter(w => w !== t);
          }
        });
        
        selectStr += ', sizes:poster_sizes(*)';
        dbQuery = supabase.from('products').select(selectStr).eq('is_active', true);

        if (words.length > 0) {
          const orConditions = words.map(w => `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{"${w}"}`).join(',');
          dbQuery = dbQuery.or(orConditions);
        } else if (searchType === 'all') {
          dbQuery = dbQuery.or(`name.ilike.%${qText}%,description.ilike.%${qText}%`);
        }
      }
    } else {
      // If no query text, initialize normally
      selectStr += ', sizes:poster_sizes(*)';
      dbQuery = supabase.from('products').select(selectStr).eq('is_active', true);
    }

    // 2. Product Type Filter
    if (searchType !== 'all') {
      dbQuery = dbQuery.eq('product_type', searchType);
    }

    // 3. Categories Filter
    if (cats.length > 0) {
      dbQuery = dbQuery.in('category_id', cats);
    }

    // 4. Price Filter (requires complex handling due to poster sizes vs earring prices)
    // Supabase JS doesn't easily filter on nested joined tables for the parent return (it filters the joined rows).
    // For now, we filter on the base product `price` column (which works for earrings).
    if (minP && !isNaN(Number(minP))) {
      dbQuery = dbQuery.gte('price', Number(minP));
    }
    if (maxP && !isNaN(Number(maxP))) {
      dbQuery = dbQuery.lte('price', Number(maxP));
    }

    // 5. Sorting
    switch (sort) {
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'price_asc':
        dbQuery = dbQuery.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        dbQuery = dbQuery.order('price', { ascending: false, nullsFirst: false });
        break;
      case 'featured':
      default:
        dbQuery = dbQuery.order('is_featured', { ascending: false });
        break;
    }

    const { data } = await dbQuery.limit(24);
    
    // Post-process price filtering for Posters (since poster prices are in sizes array)
    let filteredData = (data as Product[]) || [];
    
    if (minP || maxP) {
      filteredData = filteredData.filter(p => {
        if (p.product_type === 'earring') return true; // Already filtered by DB
        // For posters, check if any active size meets the criteria
        const min = minP ? Number(minP) : 0;
        const max = maxP ? Number(maxP) : Infinity;
        const validSizes = p.sizes?.filter(s => s.is_active && s.price >= min && s.price <= max) || [];
        return validSizes.length > 0;
      });
    }

    setProducts(filteredData);
    setLoading(false);
    
    // Update URL silently
    window.history.replaceState(null, '', `/search?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger search when query changes (debounced) is handled by handleInput
  // We removed the auto-search on filter change so users must click "Apply Filters"

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="page-container py-8 md:py-12">
      {/* Search Input Top Bar */}
      <div className="max-w-3xl mx-auto mb-8 md:mb-12">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="relative flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Search posters, earrings, styles..."
              className="w-full input-luxe pl-12 pr-12 py-3.5 md:py-4 text-base md:text-lg rounded-2xl"
              autoFocus
            />
            {query && (
              <button onClick={() => handleInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-3.5 md:p-4 rounded-2xl border border-white/10 bg-white/5 text-white flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <div className={`w-full lg:w-64 flex-shrink-0 space-y-8 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          {/* Sort By */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase">Sort By</h3>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full input-luxe py-2.5 pl-3 pr-10 text-sm appearance-none rounded-xl"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Product Type */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase">Product Type</h3>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'All Products' },
                { id: 'poster', label: 'Wall Posters' },
                { id: 'earring', label: 'Gold Earrings' }
              ].map(type => (
                <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    selectedType === type.id ? 'border-luxe-accent bg-luxe-accent/20' : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {selectedType === type.id && <div className="w-2 h-2 rounded-full bg-luxe-accent" />}
                  </div>
                  <span className={`text-sm ${selectedType === type.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                    {type.label}
                  </span>
                  <input 
                    type="radio" 
                    name="product_type" 
                    className="hidden" 
                    checked={selectedType === type.id}
                    onChange={() => setSelectedType(type.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white text-sm font-semibold tracking-wider uppercase">Categories</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedCategories.includes(cat.id) ? 'border-luxe-accent bg-luxe-accent' : 'border-white/20 group-hover:border-white/40 bg-transparent'
                    }`}>
                      {selectedCategories.includes(cat.id) && <Search className="w-3 h-3 text-black font-bold" strokeWidth={4} />}
                    </div>
                    <span className={`text-sm ${selectedCategories.includes(cat.id) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                      {cat.name}
                    </span>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase">Price Range</h3>
            <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full input-luxe py-2 pl-7 pr-2 text-sm rounded-lg"
                />
              </div>
              <span className="text-white/30">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full input-luxe py-2 pl-7 pr-2 text-sm rounded-lg"
                />
              </div>
              <button type="submit" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </form>
          </div>
          
          
          <div className="pt-4 border-t border-white/10 space-y-3">
            <button 
              onClick={() => {
                doSearch();
                if (window.innerWidth < 1024) setShowMobileFilters(false);
              }}
              className="btn-gold w-full py-3 font-semibold text-sm shadow-lg shadow-luxe-accent/20"
            >
              Apply Filters
            </button>
            <button 
              onClick={() => {
                setSelectedType('all');
                setSelectedCategories([]);
                setMinPrice('');
                setMaxPrice('');
                setSortBy('featured');
                // Don't reset query here so they can keep their text search
                doSearch(query, 'all', [], '', '', 'featured');
                if (window.innerWidth < 1024) setShowMobileFilters(false);
              }}
              className="w-full py-3 text-sm font-medium text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 w-full">
          {!hasSearched ? (
            <div className="relative overflow-hidden w-full h-[400px] md:h-[500px] flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-black overflow-hidden">
              {/* Continuous Animated Background Gradients */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-luxe-accent/20 blur-[120px] rounded-full mix-blend-screen opacity-70 animate-[pulse_4s_ease-in-out_infinite]" />
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/15 blur-[90px] rounded-full mix-blend-screen animate-[pulse_6s_ease-in-out_infinite] delay-700" />
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 blur-[100px] rounded-full mix-blend-screen animate-[pulse_5s_ease-in-out_infinite] delay-300" />
              
              {/* Continuous Animated Logo */}
              <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)] mb-8 animate-[bounce_3s_infinite] sm:animate-none sm:hover:scale-110 sm:hover:shadow-[0_0_80px_rgba(255,255,255,0.25)] transition-all duration-700">
                <span className="font-display text-black font-bold text-5xl md:text-7xl tracking-tighter">J</span>
                <span className="font-display text-black font-light text-5xl md:text-7xl tracking-tighter -ml-2 md:-ml-3">D</span>
              </div>
              
              <h2 className="relative z-10 text-white text-2xl md:text-4xl font-display font-medium mb-4 tracking-tight">Explore the Collection</h2>
              <p className="relative z-10 text-white/40 text-sm md:text-base max-w-sm mx-auto text-center px-4">
                Search for premium wall posters, handcrafted artisan earrings, and exclusive styles.
              </p>
            </div>
          ) : loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
              <h2 className="text-white font-semibold text-lg mb-2">No results found</h2>
              <p className="text-white/40 text-sm mb-6">Try adjusting your filters or search term.</p>
              <button 
                onClick={() => {
                  setSelectedType('all');
                  setSelectedCategories([]);
                  setMinPrice('');
                  setMaxPrice('');
                  setQuery('');
                  setHasSearched(false);
                }}
                className="btn-luxe-outline text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-white/60 text-sm">
                  Showing <span className="text-white font-medium">{products.length}</span> results
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
