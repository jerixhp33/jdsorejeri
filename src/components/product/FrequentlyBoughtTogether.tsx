'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, Plus } from 'lucide-react';

import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface FrequentlyBoughtTogetherProps {
  baseProduct: Product;
  crossSells: Product[];
}

export function FrequentlyBoughtTogether({ baseProduct, crossSells }: FrequentlyBoughtTogetherProps) {
  const { addItem } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set([baseProduct.id]));

  if (!crossSells || crossSells.length === 0) {
    return null;
  }

  const allItems = [baseProduct, ...crossSells];

  const getPrice = (p: Product) => {
    return p.product_type === 'poster' ? (p.sizes?.[0]?.price || 0) : (p.price || 0);
  };

  const getPrimaryImage = (p: Product) => {
    return p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url;
  };

  const toggleItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      if (productId === baseProduct.id) return; // Keep base product selected
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const selectedTotal = allItems
    .filter((p) => selectedItems.has(p.id))
    .reduce((sum, p) => sum + getPrice(p), 0);

  const handleAddAllToCart = () => {
    const itemsToAdd = allItems.filter((p) => selectedItems.has(p.id));
    let addedCount = 0;

    itemsToAdd.forEach((p) => {
      let sizeId;
      if (p.product_type === 'poster' && p.sizes?.[0]) {
        sizeId = p.sizes[0].id;
      }
      addItem(p.id, getPrice(p), 1, sizeId, true);
      addedCount++;
    });

    toast.success(`Added ${addedCount} items to cart`);
  };

  return (
    <section className="py-16 mt-8 border-t border-white/10">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="font-display text-2xl font-bold text-white mb-8">
          Frequently Bought Together
        </h2>
        
        <div className="glass-card p-6 sm:p-8 border border-white/10 max-w-4xl">
          <div className="space-y-6">
            {allItems.map((product, index) => {
              const isSelected = selectedItems.has(product.id);
              const image = getPrimaryImage(product);
              
              return (
                <div key={product.id} className="relative">
                  {index > 0 && (
                    <div className="absolute -top-4 left-6 z-10 hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/10">
                      <Plus className="w-3.5 h-3.5 text-white/50" />
                    </div>
                  )}
                  
                  <div 
                    className={`
                      flex items-center gap-4 sm:gap-6 p-4 rounded-xl transition-all cursor-pointer border
                      ${isSelected ? 'bg-white/[0.03] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/10'}
                    `}
                    onClick={() => toggleItem(product.id)}
                  >
                    {/* Custom Checkbox */}
                    <div className={`
                      w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-white border-white text-black' : 'border-white/30 text-transparent hover:border-white/50'}
                    `}>
                      <Check className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                    </div>
                    
                    {/* Thumbnail */}
                    <div className="w-16 h-20 sm:w-20 sm:h-24 relative rounded-md overflow-hidden flex-shrink-0 border border-white/10 bg-white/5">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white/30 text-[10px]">No img</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/product/${product.slug}`} 
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className={`text-sm sm:text-base line-clamp-2 mb-1 ${isSelected ? 'text-white font-medium' : 'text-white/70'}`}>
                          {product.id === baseProduct.id && <span className="text-luxe-accent mr-2 text-xs uppercase tracking-wider font-bold">This item</span>}
                          {product.name}
                        </h3>
                      </Link>
                      <div className="text-sm sm:text-base font-bold text-white">
                        {formatCurrency(getPrice(product))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-white/60 text-sm mb-1">{selectedItems.size} items selected</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Total price: <span className="text-luxe-accent ml-2">{formatCurrency(selectedTotal)}</span>
              </h3>
            </div>
            
            <button 
              className="btn-luxe px-8 py-3.5 flex items-center justify-center gap-3 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddAllToCart}
              disabled={selectedItems.size === 0}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide uppercase">Add Selected to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
