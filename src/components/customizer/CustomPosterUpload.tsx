'use client';

import { useState, useRef } from 'react';
import { Upload, FileImage, Check, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UploadProgressRing } from './UploadProgressRing';
import { ImageQualityIndicator } from './ImageQualityIndicator';
import { uploadCustomImageWithProgress, CustomUploadRecord } from '@/lib/custom-poster';
import type { ImageQualityAnalysis } from '@/lib/image-quality';

interface CustomPosterUploadProps {
  userId: string | null;
  selectedSize: 'A5' | 'A4' | 'A3';
  onUploadSuccess: (record: CustomUploadRecord, previewUrl: string, analysis: ImageQualityAnalysis) => void;
  onClearUpload?: () => void;
  onSelectRecommendedSize?: (size: 'A5' | 'A4' | 'A3') => void;
}

export function CustomPosterUpload({
  userId,
  selectedSize,
  onUploadSuccess,
  onClearUpload,
  onSelectRecommendedSize
}: CustomPosterUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [fileSizeMb, setFileSizeMb] = useState(0);
  const [uploadedMb, setUploadedMb] = useState(0);
  
  const [uploadedRecord, setUploadedRecord] = useState<CustomUploadRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageQualityAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid format. Please upload a JPG, PNG, or WEBP photo.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size too large. Maximum allowed size is 25 MB.');
      return;
    }

    const totalMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    setFileSizeMb(totalMb);
    setUploadedMb(0);
    setIsUploading(true);
    setUploadPercent(0);

    try {
      const { record, analysis } = await uploadCustomImageWithProgress(file, userId, (pct) => {
        setUploadPercent(pct);
        setUploadedMb(parseFloat(((pct / 100) * totalMb).toFixed(2)));
      });

      const localPreview = URL.createObjectURL(file);
      setUploadedRecord(record);
      setPreviewUrl(localPreview);
      setAnalysis(analysis);
      setIsUploading(false);

      toast.success('High-resolution photo uploaded successfully!');
      onUploadSuccess(record, localPreview, analysis);
    } catch (err: any) {
      setIsUploading(false);
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload photo. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setUploadedRecord(null);
    setPreviewUrl(null);
    setAnalysis(null);
    if (onClearUpload) onClearUpload();
  };

  return (
    <div className="space-y-4">
      {/* 1. Uploading State with Real Progress Ring */}
      {isUploading ? (
        <div className="bg-luxe-gray/60 border border-amber-500/30 rounded-2xl p-6 text-center">
          <UploadProgressRing
            percentage={uploadPercent}
            fileSizeMb={fileSizeMb}
            uploadedMb={uploadedMb}
          />
        </div>
      ) : previewUrl && analysis ? (
        /* 2. Upload Complete Preview Card */
        <div className="bg-luxe-gray/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-4">
            {/* Image Thumbnail */}
            <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 bg-black">
              <img src={previewUrl} alt="Custom Poster Preview" className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3" /> Ready
              </div>
            </div>

            {/* Upload File Details */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white truncate">
                  {uploadedRecord?.original_filename || 'Custom Photo'}
                </h4>
                <button
                  onClick={handleClear}
                  className="p-1 text-white/40 hover:text-red-400 transition-colors"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-white/60 font-mono">
                {analysis.width} × {analysis.height} px • {analysis.fileSizeMb} MB
              </p>
              <p className="text-xs text-amber-400 font-medium">
                Aspect Ratio: {analysis.aspectRatioStr}
              </p>
              
              <div className="pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>

          {/* Print Quality Breakdown */}
          <ImageQualityIndicator
            analysis={analysis}
            selectedSize={selectedSize}
            onSelectRecommendedSize={onSelectRecommendedSize}
          />
        </div>
      ) : (
        /* 3. Drag & Drop Initial Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-white/20 bg-white/5 hover:border-amber-400/50 hover:bg-white/[0.07]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">Drag & Drop Your High-Res Photo</h3>
              <p className="text-xs text-white/60 mt-1">or click to browse from device</p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/50">
              <FileImage className="w-3.5 h-3.5" />
              <span>JPG • PNG • WEBP (Up to 25 MB)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
