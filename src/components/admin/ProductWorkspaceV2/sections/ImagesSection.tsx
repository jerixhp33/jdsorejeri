import { ProductFormData } from '../types';
import { ImageUploader, type UploadedImage } from '@/components/admin/ImageUploader';
import { Star } from 'lucide-react';

interface Props {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export function ImagesSection({ formData, setFormData }: Props) {
  
  const handleImagesChange = (newImages: UploadedImage[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages as any // Map UploadedImage to ProductImage
    }));
  };

  const handleImageDelete = (img: UploadedImage) => {
    setFormData(prev => {
      const deletedIds = prev.deletedImageIds || [];
      const deletedPaths = prev.deletedStoragePaths || [];
      
      if (img.id) deletedIds.push(img.id);
      if (img.storage_path) deletedPaths.push(img.storage_path);
      
      return {
        ...prev,
        deletedImageIds: deletedIds,
        deletedStoragePaths: deletedPaths
      };
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-sm mb-4">
        Upload beautiful, high-quality images. Select the <Star className="inline w-4 h-4 text-luxe-accent"/> to choose the primary cover image.
      </p>
      
      <ImageUploader 
        images={formData.images as any} 
        onChange={handleImagesChange} 
        onDelete={handleImageDelete} 
        maxImages={8} 
      />
    </div>
  );
}
