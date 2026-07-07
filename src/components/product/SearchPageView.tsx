'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import type { Product } from '@/types';

interface SearchPageViewProps {
  initialQuery: string;
}

export function SearchPageView({ initialQuery }: SearchPageViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const doSearch = async (q: string) => {
    if (!q.trim()) { setProducts([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:product_categories(*), images:product_images(*), sizes:poster_sizes(*)')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .order('is_featured', { ascending: false })
      .limit(24);
    setProducts((data as Product[]) || []);
    setLoading(false);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
  };

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  return (
    <div className="page-container py-10 md:py-16">
      {/* Search input */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search posters, earrings, styles..."
            className="w-full input-luxe pl-12 pr-12 py-4 text-lg rounded-2xl"
            autoFocus
          />
          {query && (
            <button onClick={() => handleInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {!query && (
          <div className="flex flex-wrap gap-2 mt-4">
            {['Minimalist', 'Abstract', 'Nature', 'Gold Earrings', 'Matte Poster', 'A3 Print'].map((tag) => (
              <button key={tag} onClick={() => handleInput(tag)} className="badge-luxe hover:bg-white/20 transition-all cursor-pointer">
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {query && (
        loading ? <ProductGridSkeleton count={8} /> :
        products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">No results for &ldquo;{query}&rdquo;</h2>
            <p className="text-white/40 text-sm mb-6">Try a different search term or browse our collections</p>
            <div className="flex gap-3 justify-center">
              <a href="/posters" className="btn-luxe-outline text-sm">Browse Posters</a>
              <a href="/earrings" className="btn-luxe-outline text-sm">Browse Earrings</a>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-white/40 text-sm mb-6">{products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
            </div>
          </div>
        )
      )}

      {!query && (
        <div className="text-center py-20">
          <p className="text-white/30 text-base">Start typing to search our collection</p>
        </div>
      )}
    </div>
  );
}
