'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Star, Package, Copy, Check } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product, Category, ProductType } from '@/types';
import { ProductFormModal } from './ProductFormModal';
import { ProductWorkspace } from './ProductWorkspaceV2/ProductWorkspace';
import { useScrollLock } from '@/hooks/useScrollLock';

interface AdminProductsViewProps {
  initialProducts: Product[];
  categories: Category[];
}

export function AdminProductsView({ initialProducts, categories }: AdminProductsViewProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');

  const uniqueTypes = Array.from(new Set(categories.map(c => c?.product_type).filter(Boolean)));
  const formatTypeLabel = (type: string) => {
    if (!type) return '';
    if (type === 'hair_clip') return 'Hair Clips';
    if (type === 'other') return 'Miscellaneous';
    return type.charAt(0).toUpperCase() + type.slice(1) + 's';
  };
  const [showModal, setShowModal] = useState(false);
  const [showV2, setShowV2] = useState(false);
  
  useScrollLock(showModal || showV2);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const duplicateProduct = (product: Product) => {
    setEditProduct({ ...product, id: '', name: `${product.name} (Copy)`, slug: '' });
    setShowModal(true);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, _type: 'bulk_delete' }) });
      if (!res.ok) throw new Error('Failed to delete');
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success('Products deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchesType = typeFilter === 'all' || p.product_type === typeFilter;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleActive = async (product: Product) => {
    const res = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, is_active: !product.is_active }) });
    if (res.ok) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(product.is_active ? 'Product hidden' : 'Product visible');
    } else {
      toast.error('Failed to update product');
    }
  };

  const toggleFeatured = async (product: Product) => {
    const res = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, is_featured: !product.is_featured }) });
    if (res.ok) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p));
      toast.success(product.is_featured ? 'Removed from featured' : 'Added to featured');
    } else {
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      // Delete related images first (FK constraint)
      await fetch('/api/admin/product-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      // Delete poster sizes (FK constraint)
      await fetch('/api/admin/poster-sizes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      // Delete order_items referencing this product (FK constraint: order_items_product_id_fkey)
      await fetch('/api/admin/order-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      // Delete collection_products referencing this product (FK constraint)
      await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'collection_products_by_product', product_id: productId }),
      });
      // Now delete the product itself
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to delete product');
      }
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleSaved = (savedProduct: Product) => {
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
    } else {
      setProducts(prev => [savedProduct, ...prev]);
    }
    setShowModal(false);
    setEditProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Products</h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setEditProduct(null); setShowV2(true); }}
            className="btn-gold flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-luxe pl-9 text-sm w-full"
          />
        </div>
        <div className="flex gap-2 min-w-[150px]">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ProductType | 'all')}
            className="input-luxe text-sm w-full h-[40px]"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type as string} value={type as string}>
                {formatTypeLabel(type as string)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full glass-card p-16 text-center">
            <Package className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">No products found</p>
          </div>
        ) : (
          filtered.map((product, i) => {
            const images = product.images as Array<{ url: string; is_primary: boolean }> | undefined;
            const img = images?.find((im) => im.is_primary) || images?.[0];
            const posterSizes = product.sizes as Array<{ label: string; price: number }> | undefined;
            const displayPrice =
              product.product_type !== 'poster'
                ? product.price
                : posterSizes && posterSizes.length > 0
                  ? Math.min(...posterSizes.map((s) => s.price))
                  : null;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn('glass-card overflow-hidden', !product.is_active && 'opacity-60')}
              >
                <div className="relative aspect-video bg-luxe-dark">
                  <div className="absolute top-2 right-2 z-10">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }} className={cn("w-6 h-6 rounded flex items-center justify-center transition-all", selectedIds.includes(product.id) ? "bg-luxe-accent text-black" : "bg-black/50 text-white/50 border border-white/20 hover:border-white/50")}>
                      {selectedIds.includes(product.id) && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                  {img ? (
                    <Image src={img.url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/10 text-4xl">✦</div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    <span className="badge-luxe text-[10px] capitalize">{product.product_type}</span>
                    {product.is_featured && <span className="badge-gold text-[10px]">Featured</span>}
                    {!product.is_active && (
                      <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }} className="badge-luxe text-[10px]">Hidden</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-white/40 text-xs mb-1">
                    {(product.category as { name: string } | undefined)?.name || 'Uncategorised'}
                  </p>
                  <h3 className="text-white text-sm font-medium mb-2 line-clamp-2">{product.name}</h3>
                  {displayPrice !== null && displayPrice !== undefined && (
                    <p className="text-luxe-accent font-semibold text-sm mb-2">
                      {product.product_type === 'poster' && posterSizes && posterSizes.length > 1 ? 'from ' : ''}
                      {formatCurrency(displayPrice)}
                    </p>
                  )}
                  {product.product_type === 'poster' && (
                    <p className="text-white/30 text-xs mb-3">
                      {(product.sizes as Array<{ label: string }> | undefined)?.length || 0} size{((product.sizes as Array<unknown> | undefined)?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditProduct(product); setShowV2(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs transition-all"
                    >
                      <Edit2 className="w-3 h-3" />Edit
                    </button>
                    <button
                      onClick={() => toggleActive(product)}
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      title={product.is_active ? 'Hide' : 'Show'}
                    >
                      {product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditProduct({ ...product, id: '', name: `${product.name} (Copy)`, slug: '' });
                        setShowV2(true);
                      }}
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleFeatured(product)}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        product.is_featured ? 'bg-luxe-accent/20 text-luxe-accent' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      )}
                      title={product.is_featured ? 'Unfeature' : 'Feature'}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {showModal && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}

      {showV2 && (
        <ProductWorkspace
          categories={categories}
          initialData={editProduct ? {
            id: editProduct.id,
            name: editProduct.name,
            slug: editProduct.slug,
            description: editProduct.description || '',
            short_description: editProduct.short_description || '',
            product_type: editProduct.product_type || '',
            category_id: editProduct.category_id || '',
            tags: editProduct.tags || [],
            price: editProduct.price || 0,
            original_price: editProduct.original_price || 0,
            cost_price: editProduct.cost_price || 0,
            stock: editProduct.stock || 0,
            sku: editProduct.sku || '',
            status: (editProduct.status as any) || (editProduct.is_active ? 'active' : 'draft'),
            is_featured: editProduct.is_featured || false,
            is_trending: editProduct.is_trending || false,
            is_best_seller: editProduct.is_best_seller || false,
            weight_grams: editProduct.weight_grams || 0,
            length_cm: editProduct.length_cm || 0,
            width_cm: editProduct.width_cm || 0,
            height_cm: editProduct.height_cm || 0,
            seo_title: editProduct.seo_title || '',
            seo_description: editProduct.seo_description || '',
            seo_keywords: editProduct.seo_keywords || '',
            variant_combinations: (editProduct.attributes as any)?._v2_variants?.combinations || (editProduct.sizes || []).map(s => ({
              id: s.id,
              options: { Size: s.label },
              price: s.price,
              stock: s.stock,
              sku: s.sku,
              is_active: s.is_active
            })),
            variant_options: (editProduct.attributes as any)?._v2_variants?.options || ((editProduct.sizes && editProduct.sizes.length > 0) ? [{
              id: '1',
              name: 'Size',
              values: editProduct.sizes.map(s => s.label)
            }] : []),
            attributes: (() => {
              // Strip out internal v2 variants from attributes shown to user
              if (!editProduct.attributes) return {};
              const { _v2_variants, ...rest } = editProduct.attributes as any;
              return rest;
            })(),
            images: editProduct.images || []
          } : null}
          onClose={() => { setShowV2(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}

      {selectedIds.length > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-card px-6 py-4 rounded-full flex items-center gap-6 shadow-2xl border-luxe-accent/30">
          <span className="text-white font-medium">{selectedIds.length} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds([])} className="text-white/50 hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={bulkDelete} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete All
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}