'use client';

import { useState } from 'react';
import { Eye, Download, CheckCircle2, Sparkles, FileImage, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CustomImageViewer } from './CustomImageViewer';

interface CustomOrderViewerProps {
  uploadId: string;
  posterSize?: string;
  frameChoice?: string;
  resolution?: string;
  fileSizeMb?: number;
  qualityStatus?: string;
}

export function CustomOrderViewer({
  uploadId,
  posterSize = 'A4',
  frameChoice = 'None',
  resolution = '4000x6000',
  fileSizeMb = 8.1,
  qualityStatus = 'excellent'
}: CustomOrderViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>('original.jpg');
  const [width, setWidth] = useState<number>(4000);
  const [height, setHeight] = useState<number>(6000);
  const [fileSize, setFileSize] = useState<number>(fileSizeMb * 1024 * 1024);

  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchSignedViewUrl = async () => {
    if (signedUrl) {
      setIsViewerOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/custom-poster/${uploadId}/view`);
      const data = await res.json();

      if (!res.ok || !data.signedUrl) {
        throw new Error(data.error || 'Failed to fetch signed image view URL');
      }

      setSignedUrl(data.signedUrl);
      if (data.upload) {
        setOriginalFilename(data.upload.original_filename);
        setWidth(data.upload.width);
        setHeight(data.upload.height);
        setFileSize(data.upload.file_size);
      }

      setIsLoading(false);
      setIsViewerOpen(true);
    } catch (err: any) {
      setIsLoading(false);
      console.error(err);
      toast.error(err.message || 'Failed to load high-resolution image');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/admin/custom-poster/${uploadId}/download`);
      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || 'Failed to generate download URL');
      }

      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename || 'JD-Custom-Poster-Original.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Original high-resolution download started!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Customer Uploaded Photo Details
        </h4>
        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-medium capitalize">
          {qualityStatus} Quality ✓
        </span>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">Poster Size</span>
          <span className="font-bold text-white">{posterSize}</span>
        </div>
        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">Frame Option</span>
          <span className="font-bold text-white capitalize">{frameChoice}</span>
        </div>
        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">Resolution</span>
          <span className="font-mono text-white">{resolution} px</span>
        </div>
        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">File Size</span>
          <span className="font-mono text-white">{fileSizeMb} MB</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={fetchSignedViewUrl}
          disabled={isLoading}
          className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          ) : (
            <Eye className="w-4 h-4 text-amber-400" />
          )}
          View High-Res Photo
        </button>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 py-2.5 bg-amber-400 text-black hover:bg-amber-300 font-bold text-xs rounded-lg shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Original
        </button>
      </div>

      {/* Full-Screen Image Viewer Modal */}
      {signedUrl && (
        <CustomImageViewer
          uploadId={uploadId}
          signedUrl={signedUrl}
          originalFilename={originalFilename}
          width={width}
          height={height}
          fileSize={fileSize}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
