'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Search, Filter } from 'lucide-react';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Portal } from '@/components/ui/Portal';
import Image from 'next/image';

interface BulkProductEditorProps {
  products: Product[];
  onClose: () => void;
  onSave: (updatedProducts: Product[]) => void;
}

export function BulkProductEditor({ products, onClose, onSave }: BulkProductEditorProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modifications, setModifications] = useState<Record<string, Partial<Product>>>({});
  const [sizeModifications, setSizeModifications] = useState<Record<string, Record<string, any>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const uniqueTypes = Array.from(new Set(products.map(p => p.product_type).filter(Boolean)));

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || p.product_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const handleModify = (id: string, field: keyof Product, value: any) => {
    setModifications(prev => {
      const currentMods = prev[id] || {};
      const originalValue = products.find(p => p.id === id)?.[field];

      if (originalValue === value) {
        // If changing back to original, remove from mods
        const newMods = { ...currentMods };
        delete newMods[field];
        if (Object.keys(newMods).length === 0) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return { ...prev, [id]: newMods };
      }

      return {
        ...prev,
        [id]: {
          ...currentMods,
          [field]: value
        }
      };
    });
  };

  const handleSizeModify = (productId: string, sizeId: string, field: string, value: any) => {
    setSizeModifications(prev => {
      const productSizes = prev[productId] || {};
      const currentSizeMods = productSizes[sizeId] || {};
      
      const product = products.find(p => p.id === productId);
      const originalSize = (product?.sizes as any[])?.find(s => s.id === sizeId);
      
      if (originalSize?.[field] === value) {
        const newSizeMods = { ...currentSizeMods };
        delete newSizeMods[field];
        if (Object.keys(newSizeMods).length === 0) {
          const newProductSizes = { ...productSizes };
          delete newProductSizes[sizeId];
          if (Object.keys(newProductSizes).length === 0) {
            const next = { ...prev };
            delete next[productId];
            return next;
          }
          return { ...prev, [productId]: newProductSizes };
        }
        return {
          ...prev,
          [productId]: { ...productSizes, [sizeId]: newSizeMods }
        };
      }
      
      return {
        ...prev,
        [productId]: {
          ...productSizes,
          [sizeId]: { ...currentSizeMods, [field]: value }
        }
      };
    });
  };

  const handleSaveAll = async () => {
    const modKeys = Object.keys(modifications);
    const sizeModKeys = Object.keys(sizeModifications);
    if (modKeys.length === 0 && sizeModKeys.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const itemsToUpdate = modKeys.map(id => {
        return {
          id,
          ...modifications[id],
          updated_at: new Date().toISOString()
        };
      });

      const sizeUpdates: any[] = [];
      Object.entries(sizeModifications).forEach(([productId, sizes]) => {
        Object.entries(sizes).forEach(([sizeId, updates]) => {
          sizeUpdates.push({
            id: sizeId,
            ...updates
          });
        });
      });

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _type: 'bulk_update',
          items: itemsToUpdate,
          sizeUpdates: sizeUpdates
        })
      });

      if (!res.ok) throw new Error('Failed to save bulk changes');

      // Create new products array with changes applied locally
      const updatedProducts = products.map(p => {
        let updatedProduct = { ...p };
        if (modifications[p.id]) {
          updatedProduct = { ...updatedProduct, ...modifications[p.id] } as Product;
        }
        if (sizeModifications[p.id]) {
          const sizes = (updatedProduct.sizes as any[] || []).map(s => {
            if (sizeModifications[p.id][s.id]) {
              return { ...s, ...sizeModifications[p.id][s.id] };
            }
            return s;
          });
          updatedProduct = { ...updatedProduct, sizes } as any;
        }
        return updatedProduct;
      });

      toast.success(`Successfully updated products`);
      onSave(updatedProducts);
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Bulk Product Editor
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {Object.keys(modifications).length} products modified
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-white/5 bg-[#161616] flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white appearance-none focus:outline-none focus:border-white/30"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(t => (
                    <option key={t as string} value={t as string}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={(Object.keys(modifications).length === 0 && Object.keys(sizeModifications).length === 0) || isSaving}
              className="btn-gold flex items-center gap-2 py-2 px-5 text-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-[#0a0a0a]">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-[#161616] z-10 shadow-sm border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 font-medium text-white/60 w-[60px]">Image</th>
                  <th className="px-6 py-3 font-medium text-white/60 min-w-[250px]">Product Name</th>
                  <th className="px-6 py-3 font-medium text-white/60 w-[200px]">Base Price</th>
                  <th className="px-6 py-3 font-medium text-white/60 w-[180px]">Stock</th>
                  <th className="px-6 py-3 font-medium text-white/60 w-[120px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map(product => {
                  const isModified = !!modifications[product.id] || !!sizeModifications[product.id];
                  const currentVals = { ...product, ...modifications[product.id] };
                  
                  const images = product.images as any[];
                  const img = images?.find(i => i.is_primary)?.url || images?.[0]?.url;
                  
                  const isPoster = product.product_type === 'poster';

                  return (
                    <tr 
                      key={product.id} 
                      className={cn(
                        "group transition-colors hover:bg-white/[0.02]",
                        isModified ? "bg-[#e5d083]/[0.05]" : ""
                      )}
                    >
                      <td className="px-6 py-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-black/50 border border-white/10 relative shrink-0">
                          {img ? (
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={currentVals.name}
                          onChange={(e) => handleModify(product.id, 'name', e.target.value)}
                          className={cn(
                            "w-full bg-transparent border-b border-transparent focus:border-[#e5d083]/50 px-2 py-1 outline-none transition-colors",
                            modifications[product.id]?.name !== undefined ? "text-[#e5d083]" : "text-white"
                          )}
                        />
                      </td>
                      <td className="px-6 py-3">
                        {isPoster ? (
                          <div className="flex flex-col gap-1">
                            {((product.sizes as any[]) || []).map(size => {
                              const currentSizeVal = sizeModifications[product.id]?.[size.id]?.price ?? size.price;
                              const isSizeModified = sizeModifications[product.id]?.[size.id]?.price !== undefined;
                              return (
                                <div key={size.id} className="flex items-center gap-2 h-8">
                                  <span className="text-[10px] text-white/50 w-16 shrink-0 truncate" title={size.label}>{size.label}</span>
                                  <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">₹</span>
                                    <input
                                      type="number"
                                      value={currentSizeVal ?? ''}
                                      onChange={(e) => handleSizeModify(product.id, size.id, 'price', Number(e.target.value))}
                                      className={cn(
                                        "w-full bg-transparent border-b border-white/5 focus:border-[#e5d083]/50 pl-6 pr-1 py-1 outline-none transition-colors text-xs [&::-webkit-inner-spin-button]:appearance-none",
                                        isSizeModified ? "text-[#e5d083]" : "text-white"
                                      )}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                            <input
                              type="number"
                              value={currentVals.price || 0}
                              onChange={(e) => handleModify(product.id, 'price', Number(e.target.value))}
                              className={cn(
                                "w-full bg-transparent border-b border-transparent focus:border-[#e5d083]/50 pl-6 pr-2 py-1 outline-none transition-colors",
                                modifications[product.id]?.price !== undefined ? "text-[#e5d083]" : "text-white"
                              )}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {isPoster ? (
                          <div className="flex flex-col gap-1">
                            {((product.sizes as any[]) || []).map(size => {
                              const currentSizeStock = sizeModifications[product.id]?.[size.id]?.stock ?? size.stock;
                              const isStockModified = sizeModifications[product.id]?.[size.id]?.stock !== undefined;
                              return (
                                <div key={size.id} className="flex items-center gap-2 h-8">
                                  <input
                                    type="number"
                                    value={currentSizeStock ?? ''}
                                    onChange={(e) => handleSizeModify(product.id, size.id, 'stock', Number(e.target.value))}
                                    className={cn(
                                      "w-full bg-transparent border-b border-white/5 focus:border-[#e5d083]/50 px-2 py-1 outline-none transition-colors text-xs [&::-webkit-inner-spin-button]:appearance-none",
                                      isStockModified ? "text-[#e5d083]" : "text-white"
                                    )}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={currentVals.stock || 0}
                            onChange={(e) => handleModify(product.id, 'stock', Number(e.target.value))}
                            className={cn(
                              "w-full bg-transparent border-b border-transparent focus:border-[#e5d083]/50 px-2 py-1 outline-none transition-colors",
                              modifications[product.id]?.stock !== undefined ? "text-[#e5d083]" : "text-white"
                            )}
                          />
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={currentVals.is_active}
                              onChange={(e) => handleModify(product.id, 'is_active', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e5d083]"></div>
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            currentVals.is_active ? "text-white" : "text-white/40"
                          )}>
                            {currentVals.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-white/40">
                No products found matching your search.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Portal>
  );
}
