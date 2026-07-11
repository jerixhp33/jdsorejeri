import { ProductFormData } from '../types';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
// We will integrate dnd-kit and react-easy-crop later for full sorting and cropping.
// For now, this is a placeholder UI for the image gallery.

interface Props {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export function ImagesSection({ formData, setFormData }: Props) {
  return (
    <div className="space-y-6">
      
      {/* Upload Zone */}
      <div className="border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-luxe-accent/50 hover:bg-white/5 transition-all cursor-pointer">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8 text-white/50" />
        </div>
        <h4 className="text-white font-medium mb-1">Drag & Drop Images</h4>
        <p className="text-white/40 text-sm mb-4">or click to browse from your computer</p>
        <button className="btn-luxe-outline text-sm">Select Files</button>
      </div>

      {/* Gallery Grid */}
      {formData.images && formData.images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {formData.images.map((img, idx) => (
            <div key={img.id || idx} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="Product" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button className="btn-luxe-outline text-xs py-1 px-3">Crop</button>
                <button className="btn-gold text-xs py-1 px-3">Make Primary</button>
                <button className="text-red-400 hover:text-red-300 text-xs mt-2 font-medium">Remove</button>
              </div>

              {img.is_primary && (
                <div className="absolute top-2 left-2 badge-gold text-[10px]">Primary</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/5">
          <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/30 text-sm">No images uploaded yet.</p>
        </div>
      )}

    </div>
  );
}
