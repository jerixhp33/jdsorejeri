'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Download, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface CustomImageViewerProps {
  uploadId: string;
  signedUrl: string;
  originalFilename: string;
  width: number;
  height: number;
  fileSize: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomImageViewer({
  uploadId,
  signedUrl,
  originalFilename,
  width,
  height,
  fileSize,
  isOpen,
  onClose
}: CustomImageViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const fileSizeMb = (fileSize / (1024 * 1024)).toFixed(2);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/admin/custom-poster/${uploadId}/download`);
      const data = await res.json();
      
      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || 'Download generation failed');
      }

      // Trigger browser download via signed URL
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename || originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Original high-resolution file download initiated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to download original photo');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-900/80">
        <div>
          <h3 className="text-sm font-semibold text-white truncate max-w-md">{originalFilename}</h3>
          <p className="text-xs text-white/50 font-mono">
            {width} × {height} px • {fileSizeMb} MB
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-amber-400 font-medium">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
              className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black hover:bg-amber-300 font-bold text-xs rounded-lg shadow-lg shadow-amber-400/20 transition-all"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Original
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Canvas Container */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-black/60">
        <div
          className="transition-transform duration-200 ease-out max-w-full max-h-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={signedUrl}
            alt={originalFilename}
            className="max-w-none rounded-lg shadow-2xl border border-white/10"
          />
        </div>
      </div>
    </div>
  );
}
