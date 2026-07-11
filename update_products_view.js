const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/admin/AdminProductsView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace('Plus, Search, Edit2, Trash2, Eye, EyeOff, Star, Package', 'Plus, Search, Edit2, Trash2, Eye, EyeOff, Star, Package, Copy, Check');

// 2. Add state and handlers
const stateInjection = `  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const duplicateProduct = (product: Product) => {
    setEditProduct({ ...product, id: '', name: \`\${product.name} (Copy)\`, slug: '' });
    setShowModal(true);
  };

  const bulkDelete = async () => {
    if (!confirm(\`Delete \${selectedIds.length} products? This cannot be undone.\`)) return;
    try {
      const res = await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, _type: 'bulk_delete' }) });
      if (!res.ok) throw new Error('Failed to delete');
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success('Products deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };`;
content = content.replace('  const [editProduct, setEditProduct] = useState<Product | null>(null);', stateInjection);

// 3. Add Select All
const selectAllInjection = `        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedIds(selectedIds.length === filtered.length && filtered.length > 0 ? [] : filtered.map(p => p.id))} className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center", selectedIds.length === filtered.length && filtered.length > 0 ? "bg-luxe-accent border-luxe-accent text-black" : "border-white/20")}>
                {selectedIds.length === filtered.length && filtered.length > 0 && <Check className="w-3 h-3" />}
              </div>
              Select All
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">`;
content = content.replace('        <div className="flex flex-col sm:flex-row gap-4">', selectAllInjection);
// Note: We need to close the extra div that was opened. Let's find the closing tag for the flex container.
content = content.replace(`          <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="btn-luxe whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>`, `          <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="btn-luxe whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
        </div>
      </div>`);


// 4. Add Checkbox to Card
const cardCheckboxInjection = `<div className="relative aspect-video bg-luxe-dark">
                  <div className="absolute top-2 right-2 z-10">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }} className={cn("w-6 h-6 rounded flex items-center justify-center transition-all", selectedIds.includes(product.id) ? "bg-luxe-accent text-black" : "bg-black/50 text-white/50 border border-white/20 hover:border-white/50")}>
                      {selectedIds.includes(product.id) && <Check className="w-4 h-4" />}
                    </button>
                  </div>`;
content = content.replace('<div className="relative aspect-video bg-luxe-dark">', cardCheckboxInjection);


// 5. Add Duplicate Button to Card Actions
const copyBtnInjection = `<button
                      onClick={() => toggleActive(product)}
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      title={product.is_active ? 'Hide' : 'Show'}
                    >
                      {product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => duplicateProduct(product)}
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>`;
content = content.replace(`<button
                      onClick={() => toggleActive(product)}
                      className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      title={product.is_active ? 'Hide' : 'Show'}
                    >
                      {product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>`, copyBtnInjection);


// 6. Add Floating Action Bar
const floatingBarInjection = `      {showModal && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
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
}`;
content = content.replace(`      {showModal && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}`, floatingBarInjection);


fs.writeFileSync(filePath, content);
console.log('AdminProductsView updated successfully');
