'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProgress } from './SidebarProgress';
import { LivePreview } from './LivePreview';
import { FloatingActionBar } from './FloatingActionBar';
import { ProductFormData } from './types';
import { SECTIONS } from './constants';
import { useScrollLock } from '@/hooks/useScrollLock';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/utils';

// Hooks
import { useProductForm } from './hooks/useProductForm';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAIGeneration } from './hooks/useAIGeneration';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';

// Sections
import { BasicInfoSection } from './sections/BasicInfoSection';
import { DescriptionSection } from './sections/DescriptionSection';
import { PricingSection } from './sections/PricingSection';
import { InventorySection } from './sections/InventorySection';
import { ShippingSection } from './sections/ShippingSection';
import { VariantSection } from './sections/VariantSection';
import { ImagesSection } from './sections/ImagesSection';
import { AttributesSection } from './sections/AttributesSection';
import { MarketingSection } from './sections/MarketingSection';
import { SEOSection } from './sections/SEOSection';

import { Product, Category } from '@/types';

interface ProductWorkspaceProps {
  initialData?: ProductFormData | null;
  categories: Category[];
  onClose: () => void;
  onSaved?: (product: Product) => void;
}

export function ProductWorkspace({ initialData, categories, onClose, onSaved }: ProductWorkspaceProps) {
  useScrollLock(true);
  
  const { formData, setFormData, updateField, updateAttribute, removeAttribute, undo, redo, canUndo, canRedo } = useProductForm(initialData);
  const { 
    isGenerating, 
    generateFullDescription, 
    generateShortDescription, 
    generateSEO, 
    generateTags 
  } = useAIGeneration(formData, updateField);

  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isSavingRef = useRef(false);

  // Auto-Save Hook (15s debounce)
  const saveAction = async (data: ProductFormData) => {
    if (isSavingRef.current) return null;
    
    try {
      if (!data.name || !data.category_id || !data.product_type) {
        // Don't throw for auto-save, just gracefully exit until they fill it out
        console.warn('Skipping save: Name, Category, and Product Type are required.');
        return null;
      }
      isSavingRef.current = true;
      
      const slug = data.slug || (generateSlug(data.name) + '-' + Math.random().toString(36).substring(2, 6));

      const payload = {
        name: data.name,
        slug,
        description: data.description,
        short_description: data.short_description,
        product_type: data.product_type,
        category_id: data.category_id,
        tags: data.tags,
        price: data.price,
        original_price: data.original_price,
        cost_price: data.cost_price,
        stock: data.stock,
        sku: data.sku,
        status: data.status,
        is_featured: data.is_featured,
        is_trending: data.is_trending,
        is_best_seller: data.is_best_seller,
        weight_grams: data.weight_grams,
        length_cm: data.length_cm,
        width_cm: data.width_cm,
        height_cm: data.height_cm,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        seo_keywords: data.seo_keywords,
        attributes: {
          ...(data.attributes || {}),
          _v2_variants: {
            options: data.variant_options,
            combinations: data.variant_combinations
          }
        },
        is_active: data.status === 'active',
        updated_at: new Date().toISOString(),
      };

      let savedProduct;

      if (data.id) {
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: data.id, ...payload })
        });
        if (!res.ok) throw new Error('Failed to update product');
        savedProduct = await res.json();
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, created_at: new Date().toISOString() })
        });
        if (!res.ok) throw new Error('Failed to create product');
        savedProduct = await res.json();
        
        // Update the form data with the new ID so subsequent saves are PATCHes
        updateField('id', savedProduct.id);
        data.id = savedProduct.id; // update local ref for subsequent calls in this block
      }

      // Handle Generic Variants (mapped to poster_sizes for legacy compatibility)
      if (data.variant_combinations && data.variant_combinations.length > 0) {
        const validSizes = data.variant_combinations.filter(c => c.is_active);
        
        await fetch('/api/admin/poster-sizes', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            product_id: savedProduct.id, 
            sizes: validSizes.map(s => {
              const label = Object.values(s.options).join(' / ') || 'Unknown';
              return { 
                label, 
                width_cm: null, 
                height_cm: null, 
                price: s.price || 0, 
                stock: s.stock || 0, 
                sku: s.sku || null, 
                is_active: true 
              };
            }) 
          }),
        });
      }

      // Handle Images
      if ((data.images && data.images.length > 0) || (data.deletedImageIds && data.deletedImageIds.length > 0)) {
        const imgResponse = await fetch('/api/admin/product-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: savedProduct.id,
            images: (data.images || []).map((img, i) => {
              const imgPayload: any = { 
                url: img.url, 
                storage_path: img.storage_path, 
                display_order: i, 
                is_primary: img.is_primary || false 
              };
              if (img.id && img.id.length > 20 && !img.id.startsWith('temp-')) {
                imgPayload.id = img.id;
              }
              return imgPayload;
            }),
            deletedImageIds: data.deletedImageIds || [],
            deletedStoragePaths: data.deletedStoragePaths || [],
          }),
        });
        
        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          if (imgData.images) {
            updateField('images', imgData.images);
            data.images = imgData.images;
          }
        }
        
        // Clear deleted tracking after successful save
        updateField('deletedImageIds', []);
        updateField('deletedStoragePaths', []);
      }
      
      return savedProduct;

    } catch (err: any) {
      console.error('Save failed', err);
      toast.error(err.message || 'Failed to save product');
      throw err;
    } finally {
      isSavingRef.current = false;
    }
  };
  const { isSaving, lastSavedTime, hasUnsavedChanges } = useAutoSave(formData, saveAction, 15000);

  // Protect against browser refresh/close
  useUnsavedChanges(hasUnsavedChanges);

  // Actions
  const handleSaveDraft = async () => {
    if (!formData.name || !formData.category_id || !formData.product_type) {
      toast.error('Name, Category, and Product Type are required to save.');
      return;
    }
    if (isSavingRef.current) {
      toast.info('Finishing background save, please wait a moment...');
      return;
    }
    updateField('status', 'draft');
    const p = await saveAction({ ...formData, status: 'draft' });
    if (p && onSaved) onSaved(p);
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.category_id || !formData.product_type) {
      toast.error('Name, Category, and Product Type are required to publish.');
      return;
    }
    if (isSavingRef.current) {
      toast.info('Finishing background save, please wait a moment...');
      return;
    }
    updateField('status', 'active');
    const p = await saveAction({ ...formData, status: 'active' });
    if (p) {
      toast.success('Product published successfully!');
      if (onSaved) onSaved(p);
      onClose();
    }
  };

  const handleArchive = async () => {
    if (isSavingRef.current) {
      toast.info('Finishing background save, please wait a moment...');
      return;
    }
    updateField('status', 'archived');
    await saveAction({ ...formData, status: 'archived' });
    toast.success('Product archived successfully!');
    onClose();
  };

  const handleSchedule = () => {
    // Phase 2 feature
    toast.info('Scheduling will be available in the next update.');
  };

  const handleDuplicate = () => {
    setFormData(prev => ({
      ...prev,
      id: undefined, // ensure it's created as new
      name: `${prev.name} (Copy)`,
      slug: '', // clear slug so it regenerates
      sku: '', // clear sku
      status: 'draft',
      variant_combinations: prev.variant_combinations.map(c => ({
        ...c,
        id: crypto.randomUUID(), // new UUIDs for duplicated variants
        sku: '' // clear sku
      }))
    }));
    toast.success('Product duplicated as Draft. Don\'t forget to save!');
  };

  useKeyboardShortcuts({
    onSaveDraft: handleSaveDraft,
    onPublish: handlePublish,
    onUndo: undo,
    onRedo: redo
  });

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('Discard unsaved changes?')) onClose();
    } else {
      onClose();
    }
  };

  // Scroll Spy for Sidebar Active State
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = SECTIONS.map(s => document.getElementById(`section-${s.id}`));
      const scrollPosition = container.scrollTop + 200; // offset

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: element.offsetTop - 40,
        behavior: 'smooth'
      });
    }
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'basic': return <BasicInfoSection formData={formData} updateField={updateField} onGenerateTags={generateTags} isGeneratingTags={isGenerating.tags} categories={categories} />;
      case 'description': return <DescriptionSection formData={formData} updateField={updateField} onGenerateFullDesc={generateFullDescription} onGenerateShortDesc={generateShortDescription} isGeneratingFullDesc={isGenerating.description} isGeneratingShortDesc={isGenerating.short_description} />;
      case 'pricing': return <PricingSection formData={formData} updateField={updateField} />;
      case 'inventory': return <InventorySection formData={formData} updateField={updateField} />;
      case 'shipping': return <ShippingSection formData={formData} updateField={updateField} />;
      case 'variants': return <VariantSection formData={formData} setFormData={setFormData} />;
      case 'images': return <ImagesSection formData={formData} setFormData={setFormData} />;
      case 'attributes': return <AttributesSection formData={formData} updateAttribute={updateAttribute} removeAttribute={removeAttribute} />;
      case 'seo': return (
        <div className="space-y-12">
          <MarketingSection formData={formData} updateField={updateField} />
          <SEOSection formData={formData} updateField={updateField} onGenerateSEO={generateSEO} isGeneratingSEO={isGenerating.seo} />
        </div>
      );
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      data-lenis-prevent="true"
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden"
    >
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0 bg-black/50">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-display text-lg">
            {initialData ? 'Edit Product' : 'New Product'}
          </h1>
          {/* Save Status Indicator */}
          <div className="text-xs text-white/50">
            {isSaving ? 'Saving...' : lastSavedTime ? `Saved at ${lastSavedTime.toLocaleTimeString()}` : hasUnsavedChanges ? 'Unsaved changes' : 'Draft'}
          </div>
        </div>
        <button onClick={handleCancel} className="text-white/50 hover:text-white text-sm">
          Close
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <SidebarProgress activeSection={activeSection} onSectionClick={handleSectionClick} />
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 overscroll-contain">
          <div className="max-w-3xl mx-auto space-y-12">
            {SECTIONS.map((section) => (
              <div key={section.id} id={`section-${section.id}`} className="scroll-mt-10">
                <h3 className="text-white text-xl font-semibold mb-6 border-b border-white/10 pb-2">
                  {section.label}
                </h3>
                <div className="glass-card p-6 md:p-8 rounded-xl shadow-xl border-white/5">
                  {renderSection(section.id)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LivePreview formData={formData} />
        
        <FloatingActionBar 
          saving={isSaving}
          onCancel={handleCancel}
          onDuplicate={handleDuplicate}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onSchedule={handleSchedule}
          onArchive={handleArchive}
        />
      </div>
    </motion.div>
  );
}
