'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export function WishlistView() {
  const { items, loading, toggle, remove } = useWishlist();
  const { addItem } = useCart();
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const router = useRouter();

  const handleMoveToCart = async (product: any, sizeId: string | null, price: number) => {
    try {
      setAddingItem(product.id);
      await addItem(product.id, price, 1, sizeId || undefined);
      await remove(product.id);
    } catch (e) {
      toast.error('Failed to move to cart');
    } finally {
      setAddingItem(null);
    }
  };

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
          <ProductGridSkeleton count={4} />
        ) : items.length === 0 ? (
          <div className="text-center py-24 glass-card">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <Heart className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Your wishlist is empty</h2>
            <p className="text-white/40 text-sm mb-6">Save items you love and find them here later</p>
            <Link prefetch={true} href="/" className="btn-gold text-sm inline-block">Explore Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => {
              if (!item.product) return null;
              const product = item.product;
              const img = (product.images as any[])?.find((i: any) => i.is_primary) || (product.images as any[])?.[0];
              
              const activeSizes = product.sizes?.filter((s: any) => s.is_active !== false) ?? [];
              const inStockSizes = activeSizes.filter((s: any) => s.stock > 0);
              
              const isInStock = product.product_type === 'poster' 
                ? inStockSizes.length > 0 
                : (product.stock ?? 0) > 0;
                
              const cheapestSize = inStockSizes.sort((a: any, b: any) => a.price - b.price)[0];
              
              const displayPrice = product.product_type === 'poster' 
                ? (cheapestSize?.price || activeSizes[0]?.price || 0)
                : (product.price || 0);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden flex flex-row items-stretch"
                >
                  <Link prefetch={true} href={`/product/${product.slug}`} className="block w-28 sm:w-48 shrink-0 relative">
                    {img ? (
                      <Image src={img.url} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 112px, 200px" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-xl sm:text-3xl">✦</div>
                    )}
                  </Link>
                  <div className="p-3 sm:p-6 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest truncate">{product.category?.name}</p>
                        <button onClick={() => toggle(product.id)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0 -mt-1 -mr-1" title="Remove from wishlist">
                          <Heart className="w-4 h-4 fill-current text-red-400" />
                        </button>
                      </div>
                      <Link prefetch={true} href={`/product/${product.slug}`}>
                        <h3 className="text-sm sm:text-lg font-medium text-white hover:text-luxe-accent transition-colors mb-1 sm:mb-2 line-clamp-2">{product.name}</h3>
                      </Link>
                      <div className="flex items-center h-6 mb-2 sm:mb-4">
                        {!isInStock ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/70 border border-white/20 text-white/80 text-[10px] font-semibold tracking-wider uppercase">
                            Out of Stock
                          </span>
                        ) : (
                          <p className="text-white font-semibold text-sm sm:text-lg">
                            {product.product_type === 'poster' && displayPrice > 0 && <span className="text-white/40 text-[10px] sm:text-xs font-normal mr-1">From</span>}
                            {displayPrice > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(displayPrice) : 'Coming Soon'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3 mt-auto">
                      <button 
                        disabled={!isInStock || addingItem === product.id}
                        onClick={() => handleMoveToCart(product, cheapestSize?.id || null, displayPrice)}
                        className={cn(
                          "flex-1 text-center text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl font-medium transition-colors",
                          isInStock 
                            ? "bg-white text-black hover:bg-luxe-accent" 
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                        )}
                      >
                        {addingItem === product.id ? 'Moving...' : isInStock ? 'Move to Cart' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
