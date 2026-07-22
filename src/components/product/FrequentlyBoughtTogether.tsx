'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Check } from 'lucide-react';

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
    <section className="py-12 border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-2xl font-bold font-heading mb-8">Frequently Bought Together</h2>
        
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Items Row */}
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex items-center gap-4 min-w-max">
              {allItems.map((product, index) => {
                const isSelected = selectedItems.has(product.id);
                const image = getPrimaryImage(product);
                
                return (
                  <div key={product.id} className="flex items-center gap-4">
                    {index > 0 && <Plus className="w-6 h-6 text-muted-foreground" />}
                    
                    <div className="w-40 relative group">
                      <div 
                        className={`
                          relative aspect-[4/5] rounded-xl overflow-hidden mb-3 border-2 transition-all cursor-pointer
                          ${isSelected ? 'border-primary shadow-md' : 'border-transparent hover:border-border'}
                        `}
                        onClick={() => toggleItem(product.id)}
                      >
                        {image ? (
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No image</span>
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 z-10">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center border-2
                            ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background/80 border-muted-foreground/30 backdrop-blur-sm'}
                          `}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                      
                      <Link href={`/product/${product.slug}`} className="hover:underline">
                        <h3 className="text-sm font-medium line-clamp-2 mb-1">{product.name}</h3>
                      </Link>
                      <div className="text-sm font-bold text-primary">
                        {formatCurrency(getPrice(product))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Summary Box */}
          <div className="w-full lg:w-80 bg-card rounded-2xl p-6 border border-border shadow-sm flex-shrink-0">
            <h3 className="text-lg font-semibold mb-4">
              Total price: <span className="text-primary text-2xl ml-1">{formatCurrency(selectedTotal)}</span>
            </h3>
            
            <button 
              className="w-full bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-full h-12 text-base font-semibold mb-4 gap-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddAllToCart}
              disabled={selectedItems.size === 0}
            >
              <ShoppingCart className="w-5 h-5" />
              Add Selected to Cart
            </button>
            
            <div className="space-y-3 mt-4">
              {allItems.map((product) => {
                const isSelected = selectedItems.has(product.id);
                return (
                  <div 
                    key={`list-${product.id}`}
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleItem(product.id)}
                  >
                    <div className={`
                      w-5 h-5 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center
                      ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input hover:border-primary/50'}
                    `}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm ${isSelected ? 'font-medium' : 'text-muted-foreground'}`}>
                        {product.id === baseProduct.id && <strong className="mr-1 text-foreground">This item:</strong>}
                        {product.name}
                      </span>
                    </div>
                    <div className={`text-sm font-semibold flex-shrink-0 ${!isSelected && 'text-muted-foreground'}`}>
                      {formatCurrency(getPrice(product))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
