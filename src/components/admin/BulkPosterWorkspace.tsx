'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, Play, Settings, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/types';
import { cleanFilename } from '@/lib/utils/filenameToTitle';
import { BulkPosterItem, processBulkItems } from '@/lib/bulk/bulkPosterProcessor';

interface Props {
  categories: Category[];
  onClose: () => void;
  onComplete: () => void;
}

export function BulkPosterWorkspace({ categories, onClose, onComplete }: Props) {
  const [items, setItems] = useState<BulkPosterItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Settings
  const posterCategory = categories.find(c => c.product_type === 'poster');
  const [categoryId, setCategoryId] = useState(posterCategory?.id || categories[0]?.id || '');
  const [basePrice, setBasePrice] = useState(20);
  const [costPrice, setCostPrice] = useState(10);
  const [stock, setStock] = useState(100);
  
  // Marketing Flags
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Size Variants
  const [sizesConfig, setSizesConfig] = useState([
    { label: 'A4', priceDelta: 0 },
    { label: 'A3', priceDelta: 10 }
  ]);
  
  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (items.length + list.length > 50) {
      toast.error('You can only upload up to 50 posters at a time.');
      return;
    }

    const newItems: BulkPosterItem[] = list.map(f => {
      const { title, isGeneric } = cleanFilename(f.name);
      return {
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        originalFilename: f.name,
        title: isGeneric ? '' : title,
        isGeneric,
        status: 'pending',
        categoryId,
        productType: 'poster',
        basePrice,
        costPrice,
        stock,
        sizes: sizesConfig.map(s => ({ 
          label: s.label, 
          price: basePrice + s.priceDelta, 
          stock 
        })),
        isFeatured,
        isTrending,
        isBestSeller
      };
    });

    setItems(prev => [...prev, ...newItems]);
  };

  const updateItem = (id: string, updates: Partial<BulkPosterItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeImage = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const startProcessing = async () => {
    const toProcess = items.filter(i => i.status === 'pending' || i.status === 'error');
    if (toProcess.length === 0) return;

    if (toProcess.some(i => !i.title.trim())) {
      toast.error('Please enter a title for all pending posters before processing.');
      return;
    }
    
    setIsProcessing(true);
    try {
      await processBulkItems(toProcess, updateItem);
      toast.success('Bulk processing complete!');
    } catch (e: any) {
      toast.error('Processing interrupted: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const remainingCount = items.filter(i => !['completed', 'error'].includes(i.status)).length;

  return (
    <div className="fixed inset-0 z-[100] bg-luxe-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-luxe-black border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Bulk Add Posters</h2>
            <p className="text-white/50 text-sm mt-1">Upload up to 50 posters. Configure global settings before dropping files.</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Settings */}
          <div className="w-80 border-r border-white/10 bg-white/5 p-6 overflow-y-auto hidden md:block">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-luxe-accent" />
              Global Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  disabled={isProcessing || items.length > 0}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxe-accent focus:outline-none disabled:opacity-50"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {items.length > 0 && <p className="text-xs text-amber-500 mt-2">Clear items to change global settings.</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Base Price (₹)</label>
                  <input 
                    type="number" 
                    value={basePrice}
                    onChange={e => setBasePrice(Number(e.target.value))}
                    disabled={isProcessing || items.length > 0}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxe-accent focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Cost Price (₹)</label>
                  <input 
                    type="number" 
                    value={costPrice}
                    onChange={e => setCostPrice(Number(e.target.value))}
                    disabled={isProcessing || items.length > 0}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxe-accent focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-2">Default Stock</label>
                  <input 
                    type="number" 
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    disabled={isProcessing || items.length > 0}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxe-accent focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>
              
              {/* Marketing Flags */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-white/70 mb-3">Features</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} disabled={isProcessing || items.length > 0} className="rounded border-white/20 bg-black/20 text-luxe-accent focus:ring-luxe-accent disabled:opacity-50" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="checkbox" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} disabled={isProcessing || items.length > 0} className="rounded border-white/20 bg-black/20 text-luxe-accent focus:ring-luxe-accent disabled:opacity-50" />
                    Trending
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="checkbox" checked={isBestSeller} onChange={e => setIsBestSeller(e.target.checked)} disabled={isProcessing || items.length > 0} className="rounded border-white/20 bg-black/20 text-luxe-accent focus:ring-luxe-accent disabled:opacity-50" />
                    Best Seller
                  </label>
                </div>
              </div>

              {/* Sizes Config */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white/70">Poster Sizes</label>
                  <button 
                    disabled={isProcessing || items.length > 0}
                    onClick={() => setSizesConfig(prev => [...prev, { label: '', priceDelta: 0 }])}
                    className="text-xs text-luxe-accent hover:text-white transition-colors disabled:opacity-50"
                  >
                    + Add Size
                  </button>
                </div>
                
                <div className="space-y-3">
                  {sizesConfig.map((size, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={size.label}
                        onChange={e => setSizesConfig(prev => prev.map((s, i) => i === idx ? { ...s, label: e.target.value } : s))}
                        placeholder="Size (e.g. A4)"
                        disabled={isProcessing || items.length > 0}
                        className="w-1/2 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-luxe-accent focus:outline-none disabled:opacity-50"
                      />
                      <div className="relative w-1/2">
                        <span className="absolute left-3 top-2 text-white/50 text-sm">+₹</span>
                        <input 
                          type="number" 
                          value={size.priceDelta}
                          onChange={e => setSizesConfig(prev => prev.map((s, i) => i === idx ? { ...s, priceDelta: Number(e.target.value) } : s))}
                          disabled={isProcessing || items.length > 0}
                          className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:border-luxe-accent focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      <button 
                        disabled={isProcessing || items.length > 0 || sizesConfig.length === 1}
                        onClick={() => setSizesConfig(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-white/30 hover:text-red-400 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  className="w-full max-w-md border-2 border-dashed border-white/20 hover:border-luxe-accent hover:bg-luxe-accent/5 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8 text-luxe-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Drop posters here</h3>
                  <p className="text-white/50 text-center text-sm">
                    Drag and drop up to 50 images here.<br/>
                    Titles will be automatically generated from filenames.
                  </p>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => e.target.files && handleFiles(e.target.files)} 
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <span className="text-white/30 text-sm font-medium w-6">{index + 1}</span>
                    
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-white/20 m-auto mt-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="text" 
                          value={item.title}
                          onChange={e => updateItem(item.id, { title: e.target.value, isGeneric: false })}
                          disabled={isProcessing || item.status === 'completed'}
                          placeholder={item.isGeneric ? "Enter title manually..." : "Product Title"}
                          className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-luxe-accent focus:outline-none text-white font-medium w-full max-w-md transition-colors disabled:opacity-100 disabled:border-transparent px-1 py-0.5"
                        />
                        {item.isGeneric && !item.title && (
                          <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-medium shrink-0">Generic Name</span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate px-1">{item.originalFilename}</p>
                    </div>

                    <div className="shrink-0 w-32 flex items-center justify-end">
                      {item.status === 'pending' && <span className="text-sm text-white/50">Ready</span>}
                      {item.status === 'uploading' && <div className="flex items-center gap-2 text-blue-400 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Uploading</div>}
                      {item.status === 'generating_ai' && <div className="flex items-center gap-2 text-purple-400 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> AI Magic</div>}
                      {item.status === 'saving' && <div className="flex items-center gap-2 text-amber-400 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Saving</div>}
                      {item.status === 'completed' && <div className="flex items-center gap-2 text-green-400 text-sm font-medium"><CheckCircle2 className="w-5 h-5"/> Done</div>}
                      {item.status === 'error' && (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 text-red-400 text-sm font-medium"><AlertCircle className="w-4 h-4"/> Error</div>
                          <span className="text-[10px] text-red-400/70 truncate max-w-[120px]" title={item.error}>{item.error}</span>
                        </div>
                      )}
                    </div>

                    {item.status !== 'completed' && !isProcessing && (
                      <button onClick={() => removeImage(item.id)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400 transition-colors ml-2">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                {items.length < 50 && !isProcessing && (
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-white/20 text-white/70 hover:border-luxe-accent hover:text-luxe-accent hover:bg-luxe-accent/5 transition-colors text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Add More Posters ({50 - items.length} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-white/50">Total: </span>
              <span className="text-white font-bold">{items.length}</span>
            </div>
            {isProcessing && (
              <>
                <div className="text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 font-medium">{completedCount} Successful</span>
                </div>
                {errorCount > 0 && (
                  <div className="text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-400 font-medium">{errorCount} Failed</span>
                  </div>
                )}
                <div className="text-sm text-white/50">
                  {remainingCount} Remaining
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {items.length > 0 && completedCount === items.length ? (
              <button 
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl font-medium bg-luxe-accent text-luxe-black hover:brightness-110 transition-all shadow-[0_0_20px_rgba(235,213,153,0.2)]"
              >
                View Products
              </button>
            ) : items.length > 0 && (
              <button 
                onClick={startProcessing}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-luxe-accent text-luxe-black hover:brightness-110 transition-all disabled:opacity-50 disabled:hover:brightness-100 shadow-[0_0_20px_rgba(235,213,153,0.2)]"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : errorCount > 0 ? (
                  <><Play className="w-5 h-5 fill-current" /> Retry Failed</>
                ) : (
                  <><Play className="w-5 h-5 fill-current" /> Start Processing</>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
