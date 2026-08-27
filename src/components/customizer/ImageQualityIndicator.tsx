'use client';

import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import type { ImageQualityAnalysis } from '@/lib/image-quality';

interface ImageQualityIndicatorProps {
  analysis: ImageQualityAnalysis;
  selectedSize: string;
  onSelectRecommendedSize?: (size: string) => void;
}

export function ImageQualityIndicator({
  analysis,
  selectedSize,
  onSelectRecommendedSize
}: ImageQualityIndicatorProps) {
  const currentRating = analysis.sizeRatings[selectedSize as keyof typeof analysis.sizeRatings] || analysis.sizeRatings['A4'];

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'good': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'acceptable': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default: return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'acceptable':
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      default:
        return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
      {/* Top Banner for Selected Size */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusBg(currentRating.status)}`}>
        <div className="flex items-center gap-2.5">
          {getIcon(currentRating.status)}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider">
              {selectedSize} Print Quality: <span className="capitalize">{currentRating.status}</span>
            </h4>
            <p className="text-[11px] opacity-80">
              {currentRating.dpi} DPI (Minimum 150 DPI recommended)
            </p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 opacity-60" />
      </div>

      {/* Warnings & Suggestions */}
      {currentRating.status === 'low' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 space-y-2">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>
              Your photo may appear less sharp when printed at <strong>{selectedSize}</strong>.
            </span>
          </p>
          {onSelectRecommendedSize && (
            <button
              onClick={() => onSelectRecommendedSize('A4')}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
            >
              Choose A4 Instead for Better Clarity →
            </button>
          )}
        </div>
      )}

      {/* Image Specs Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">Resolution</span>
          <span className="font-mono text-white font-medium">{analysis.width} × {analysis.height} px</span>
        </div>
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">Aspect Ratio</span>
          <span className="font-mono text-white font-medium">{analysis.aspectRatioStr}</span>
        </div>
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">File Size</span>
          <span className="font-mono text-white font-medium">{analysis.fileSizeMb} MB</span>
        </div>
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-white/40 block">Recommended</span>
          <span className="text-emerald-400 font-medium font-mono">
            {Object.values(analysis.sizeRatings)
              .filter((r) => r.isRecommended)
              .map((r) => r.sizeId)
              .join(', ') || 'A5'}
          </span>
        </div>
      </div>
    </div>
  );
}
