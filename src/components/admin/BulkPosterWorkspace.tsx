'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, Play, Settings, Image as ImageIcon, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/types';
import { cleanFilename } from '@/lib/utils/filenameToTitle';
import { BulkPosterItem, processBulkItems } from '@/lib/bulk/bulkPosterProcessor';

import { ProductConfiguration } from './product/types';
import { VariantSection } from './product/VariantSection';
import { AttributesSection } from './product/AttributesSection';

interface Props {
  categories: Category[];
  onClose: () => void;
  onComplete: () => void;
}

export function BulkPosterWorkspace({ categories, onClose, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<BulkPosterItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Settings (Step 1)
  const posterCategory = categories.find(c => c.product_type === 'poster');
  const [categoryId, setCategoryId] = useState(posterCategory?.id || categories[0]?.id || '');
  
  // Marketing Flags
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Variant & Attribute Configuration
  const [config, setConfig] = useState<ProductConfiguration>({
    variant_options: [],
    variant_combinations: [],
    attributes: {}
  });

  const handleNextStep = () => {
    if (!categoryId) {
      toast.error('Please select a category first.');
      return;
    }
    setStep(2);
  };

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (items.length + list.length > 50) {
      toast.error('You can only upload up to 50 posters at a time.');
      return;
    }

    const newItems: BulkPosterItem[] = list.map(f => {
      const { title, isGeneric } = cleanFilename(f.name);
      
      // Calculate derived global stock & prices to satisfy existing schema,
      // though combinations specify their own
      const basePrice = config.variant_combinations[0]?.price || 0;
      const costPrice = 0; // Cost price logic isn't in combinations directly
      const stock = config.variant_combinations[0]?.stock || 0;

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
        sizes: config.variant_combinations.map(c => ({
          label: Object.values(c.options).join(' / ') || 'Default',
          price: c.price,
          stock: c.stock,
          sku: c.sku
        })),
        attributes: config.attributes,
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

  // Cleanup object URLs on unmount and lock body scroll
  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore body scroll
      document.body.style.overflow = '';
      
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
    <div className="fixed inset-0 z-[100] bg-luxe-black flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {step === 2 && (
                <button onClick={() => setStep(1)} disabled={isProcessing} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              Bulk Add Posters
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium">
              <span className={step === 1 ? "text-luxe-accent" : "text-white/40"}>Step 1: Configure Template</span>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <span className={step === 2 ? "text-luxe-accent" : "text-white/40"}>Step 2: Upload Files</span>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {step === 1 ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12">
              <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Category & Features */}
                <div className="glass-card p-6 md:p-8 rounded-xl border border-white/5 space-y-6">
                  <h3 className="text-xl font-semibold text-white">Basic Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                      <select 
                        value={categoryId} 
                        onChange={e => setCategoryId(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxe-accent focus:outline-none"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-3">Marketing Flags</label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                          <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded border-white/20 bg-black/20 text-luxe-accent focus:ring-luxe-accent" />
                          Featured
                        </label>
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                          <input type="checkbox" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} className="rounded border-white/20 bg-black/20 text-luxe-accent focus:ring-luxe-accent" />
                          Trending
                        </label>
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                          <input type="checkbox" checked={isBestSeller} onChange={e => setIsBestSeller(e.target.checked)} className="rounded border-white/20 bg-black/20 text-luxe-accent focus:ring-luxe-accent" />
                          Best Seller
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div className="glass-card p-6 md:p-8 rounded-xl border border-white/5 space-y-6">
                  <h3 className="text-xl font-semibold text-white">Global Attributes</h3>
                  <p className="text-white/50 text-sm mb-4">Define attributes that apply to all posters in this batch (e.g. Theme: Movie, Language: English).</p>
                  <AttributesSection 
                    attributes={config.attributes} 
                    onChange={attrs => setConfig(prev => ({ ...prev, attributes: attrs }))} 
                  />
                </div>

                {/* Variants */}
                <div className="glass-card p-6 md:p-8 rounded-xl border border-white/5 space-y-6">
                  <h3 className="text-xl font-semibold text-white">Variant Options</h3>
                  <p className="text-white/50 text-sm mb-4">Set up sizes, materials, and pricing for this batch of posters. Every uploaded poster will inherit these combinations.</p>
                  <VariantSection 
                    options={config.variant_options} 
                    combinations={config.variant_combinations} 
                    basePrice={20}
                    onChange={(options, combinations) => setConfig(prev => ({ ...prev, variant_options: options, variant_combinations: combinations }))} 
                  />
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    className="w-full max-w-xl border-2 border-dashed border-white/20 hover:border-luxe-accent hover:bg-luxe-accent/5 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Upload className="w-10 h-10 text-luxe-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Drop posters here</h3>
                    <p className="text-white/50 text-center text-sm max-w-sm">
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
                    <div className="flex justify-center mt-6 pb-6">
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
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {step === 2 && (
              <>
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

            {step === 1 ? (
              <button 
                onClick={handleNextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-luxe-accent text-luxe-black hover:brightness-110 transition-all shadow-[0_0_20px_rgba(235,213,153,0.2)]"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              items.length > 0 && completedCount === items.length ? (
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
              )
            )}
          </div>
        </div>

      </div>
  );
}
