import { useState } from 'react';
import { toast } from 'sonner';
import { ProductFormData } from '../types';
import { 
  generateDescriptionPrompt, 
  generateShortDescriptionPrompt, 
  generateSEOPrompt,
  generateTagsPrompt
} from '@/lib/ai/prompts';

export function useAIGeneration(
  formData: ProductFormData,
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
) {
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

  const generate = async (
    field: string,
    promptFn: (data: ProductFormData) => string,
    type: string,
    onSuccess?: (result: string) => void
  ) => {
    setIsGenerating(prev => ({ ...prev, [field]: true }));
    
    try {
      const response = await fetch('/api/admin/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptFn(formData),
          type,
          model: 'llama-3.3-70b-versatile' // Using recommended model
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      if (onSuccess) {
        onSuccess(data.result);
      } else {
        updateField(field as any, data.result);
      }
      
      toast.success(`${field.replace('_', ' ')} generated successfully!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'AI generation failed.');
    } finally {
      setIsGenerating(prev => ({ ...prev, [field]: false }));
    }
  };

  const generateFullDescription = () => generate('description', generateDescriptionPrompt, 'description');
  
  const generateShortDescription = () => generate('short_description', generateShortDescriptionPrompt, 'short_description');
  
  const generateSEO = () => generate('seo', generateSEOPrompt, 'seo', (result) => {
    try {
      // The prompt asks for raw JSON
      const parsed = JSON.parse(result);
      if (parsed.title) updateField('seo_title', parsed.title);
      if (parsed.description) updateField('seo_description', parsed.description);
    } catch (e) {
      console.error('Failed to parse SEO JSON', result);
      toast.error('Failed to parse AI output');
    }
  });

  const generateTags = () => generate('tags', generateTagsPrompt, 'tags', (result) => {
    const newTags = result.split(',').map(s => s.trim()).filter(Boolean);
    updateField('tags', newTags);
  });

  return {
    isGenerating,
    generateFullDescription,
    generateShortDescription,
    generateSEO,
    generateTags
  };
}
