'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product, ProductType, Category } from '@/types';

interface ProductsPageProps {
  productType: ProductType;
  title: string;
  subtitle: string;
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'rating',    label: 'Top Rated' },
];

const LIMIT = 12;

function CustomSelect({ value, onChange, options, minWidth = 150 }: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  minWidth?: number | string;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative" style={{ minWidth }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors focus:outline-none focus:border-white/20"
      >
        <span className="truncate pr-4">{options.find(o => o.value === value)?.label || 'Select'}</span>
        <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 w-full z-50 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl"
            >
              <div className="max-h-60 overflow-y-auto">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      value === opt.value
                        ? "bg-luxe-accent/20 text-luxe-accent font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductsPage({ productType, title, subtitle }: ProductsPageProps) {
  const [products, setProducts]           = useState<Product[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [filtersOpen, setFiltersOpen]     = useState(false);
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort]                   = useState('newest');
  const [maxPrice, setMaxPrice]           = useState(productType === 'poster' ? 2000 : 10000);
  const [inStockOnly, setInStockOnly]     = useState(false);
  
  const sliderMax = productType === 'poster' ? 2000 : 10000;
  const sliderStep = productType === 'poster' ? 50 : 100;

  // Fetch categories via API route (server-side, bypasses anon RLS issue)
  useEffect(() => {
    fetch(`/api/products/categories?type=${productType}`)
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [productType]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = useCallback(async (currentPage = 1, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        type: productType,
        page: String(currentPage),
        limit: String(LIMIT),
        sort,
      });
      if (selectedCategory) params.set('category', selectedCategory);
      if (debouncedSearch)  params.set('search', debouncedSearch);
      if (inStockOnly)      params.set('inStock', '1');
      if (maxPrice < sliderMax) params.set('maxPrice', String(maxPrice));

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();

      setTotal(json.total ?? 0);
      const fetched: Product[] = json.data || [];
      if (append) setProducts(prev => [...prev, ...fetched]);
      else        setProducts(fetched);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productType, selectedCategory, debouncedSearch, sort, maxPrice, inStockOnly]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  };

  const clearFilter = (key: string) => {
    if (key === 'category') setSelectedCategory('');
    if (key === 'search')   setSearch('');
    if (key === 'inStock')  setInStockOnly(false);
  };

  const hasActiveFilters = !!(selectedCategory || debouncedSearch || inStockOnly);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="page-container pt-16 sm:pt-20 md:pt-24 pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <p className="text-luxe-accent text-sm tracking-widest uppercase mb-2">
              {productType === 'poster' ? 'Wall Art' : 'Jewelry'}
            </p>
            <h1 className="section-title mb-1">{title}</h1>
            <p className="text-white/40 text-sm">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-full border border-white/10 bg-white/5 backdrop-blur-md pl-9 pr-4 py-2 text-sm text-white w-40 md:w-56 hover:bg-white/10 transition-colors placeholder-white/40 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Sort */}
            <CustomSelect
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              minWidth={160}
            />

            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-full border text-sm transition-all backdrop-blur-md',
                filtersOpen
                  ? 'border-luxe-accent bg-luxe-accent/10 text-luxe-accent'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </motion.div>

        {/* Expanded filters */}
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-2 block">Category</label>
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
                minWidth="100%"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide mb-2 flex justify-between">
                Max Price <span className="text-white">{formatCurrency(maxPrice)}</span>
              </label>
              <input type="range" min={100} max={sliderMax} step={sliderStep} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full" style={{ accentColor: '#c8a96e' }} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="inStock" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4" style={{ accentColor: '#c8a96e' }} />
              <label htmlFor="inStock" className="text-white/60 text-sm cursor-pointer">In stock only</label>
            </div>
          </motion.div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-white/30 text-xs">Active:</span>
            {selectedCategory && (
              <button onClick={() => clearFilter('category')} className="badge-luxe flex items-center gap-1 hover:bg-white/20 transition-all">
                {categories.find(c => c.id === selectedCategory)?.name}
                <X className="w-3 h-3" />
              </button>
            )}
            {search && (
              <button onClick={() => clearFilter('search')} className="badge-luxe flex items-center gap-1 hover:bg-white/20 transition-all">
                &ldquo;{search}&rdquo; <X className="w-3 h-3" />
              </button>
            )}
            {inStockOnly && (
              <button onClick={() => clearFilter('inStock')} className="badge-luxe flex items-center gap-1 hover:bg-white/20 transition-all">
                In Stock <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="page-container py-10">
        {!loading && (
          <p className="text-white/30 text-sm mb-6">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <ProductGridSkeleton count={LIMIT} />
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No products found</h3>
            <p className="text-white/40 text-sm mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory(''); setInStockOnly(false); setMaxPrice(sliderMax); }}
              className="btn-luxe-outline text-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-start">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i % LIMIT} />
              ))}
            </div>
            {products.length < total && (
              <div className="text-center mt-12">
                <button onClick={handleLoadMore} disabled={loadingMore} className="btn-luxe-outline flex items-center gap-2 mx-auto">
                  {loadingMore ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />Loading...</>
                  ) : (
                    `Load More (${total - products.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
