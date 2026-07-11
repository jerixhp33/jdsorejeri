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

interface ProductWorkspaceProps {
  initialData?: ProductFormData | null;
  onClose: () => void;
}

export function ProductWorkspace({ initialData, onClose }: ProductWorkspaceProps) {
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

  // Auto-Save Hook (15s debounce)
  const saveAction = async (data: ProductFormData) => {
    console.log('API Request: Saving Draft', data);
    // await fetch('/api/admin/products', { method: 'POST', body: JSON.stringify(data) });
  };
  const { isSaving, lastSavedTime, hasUnsavedChanges } = useAutoSave(formData, saveAction, 15000);

  // Protect against browser refresh/close
  useUnsavedChanges(hasUnsavedChanges);

  // Actions
  const handleSaveDraft = async () => {
    updateField('status', 'draft');
    await saveAction({ ...formData, status: 'draft' });
  };

  const handlePublish = async () => {
    updateField('status', 'active');
    await saveAction({ ...formData, status: 'active' });
    toast.success('Product published successfully!');
    onClose();
  };

  const handleArchive = async () => {
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
      case 'basic': return <BasicInfoSection formData={formData} updateField={updateField} onGenerateTags={generateTags} isGeneratingTags={isGenerating.tags} />;
      case 'description': return <DescriptionSection formData={formData} updateField={updateField} onGenerateFullDesc={generateFullDescription} onGenerateShortDesc={generateShortDescription} isGeneratingFullDesc={isGenerating.description} isGeneratingShortDesc={isGenerating.short_description} />;
      case 'pricing': return <PricingSection formData={formData} updateField={updateField} />;
      case 'inventory': return <InventorySection formData={formData} updateField={updateField} />;
      case 'shipping': return <ShippingSection formData={formData} updateField={updateField} />;
      case 'variants': return <VariantSection formData={formData} setFormData={setFormData} />;
      case 'images': return <ImagesSection formData={formData} setFormData={setFormData} />;
      case 'attributes': return <AttributesSection formData={formData} updateAttribute={updateAttribute} removeAttribute={removeAttribute} />;
      case 'marketing': return <MarketingSection formData={formData} updateField={updateField} />;
      case 'seo': return <SEOSection formData={formData} updateField={updateField} onGenerateSEO={generateSEO} isGeneratingSEO={isGenerating.seo} />;
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
