'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ChevronLeft } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export function WishlistView() {
  const { items, loading } = useWishlist();

  const router = useRouter();

  return (
    <div className="page-container py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => router.back()}
            className="btn-glass !p-2 !min-h-0 group"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <h1 className="font-display text-3xl font-bold text-white">My Wishlist</h1>
        </div>
        <p className="text-white/40 text-sm mb-10">
          {items.length} saved item{items.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <Heart className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Your wishlist is empty</h2>
            <p className="text-white/40 text-sm mb-6">Save items you love and find them here later</p>
            <Link prefetch={true} href="/" className="btn-gold text-sm">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item, i) =>
              item.product ? (
                <ProductCard key={item.id} product={item.product} index={i} />
              ) : null
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
