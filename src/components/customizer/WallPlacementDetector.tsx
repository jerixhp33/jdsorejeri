'use client';

import { useState } from 'react';
import { Eye, RotateCcw, Sparkles, Layers } from 'lucide-react';
import { ROOM_PRESETS, RoomPreset, WallPresetSelector } from './WallPresetSelector';

interface WallPlacementDetectorProps {
  customImagePreview: string;
  selectedSize: string;
  selectedFrame: string;
}

export function WallPlacementDetector({
  customImagePreview,
  selectedSize,
  selectedFrame
}: WallPlacementDetectorProps) {
  const [currentPreset, setCurrentPreset] = useState<RoomPreset>(ROOM_PRESETS[0]);
  const [scaleFactor, setScaleFactor] = useState(1.0);

  // Size scale multipliers
  const sizeScale = selectedSize === 'A5' ? 0.8 : selectedSize === 'A4' ? 1.0 : 1.25;

  const getFrameStyles = () => {
    const f = selectedFrame.toLowerCase();
    if (f.includes('black')) {
      return 'border-[10px] border-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.7)]';
    } else if (f.includes('white')) {
      return 'border-[10px] border-stone-100 shadow-[0_20px_45px_rgba(0,0,0,0.5)]';
    } else if (f.includes('wood')) {
      return 'border-[10px] border-[#8B5A2B] shadow-[0_20px_45px_rgba(0,0,0,0.6)]';
    } else {
      return 'shadow-[0_15px_40px_rgba(0,0,0,0.5)]';
    }
  };

  return (
    <div className="bg-luxe-gray/80 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" /> Room Wall Preview
          </h3>
          <p className="text-xs text-white/50">Simulate your custom poster on room walls</p>
        </div>

        {/* Room Presets */}
        <WallPresetSelector
          selectedPreset={currentPreset.id}
          onSelectPreset={(p) => setCurrentPreset(p)}
        />
      </div>

      {/* Room Wall Canvas */}
      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center">
        {/* Background Room Photo */}
        <img
          src={currentPreset.image}
          alt={currentPreset.name}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Lighting Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Poster Positioned on Room Wall */}
        <div
          className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
          style={{
            left: `${currentPreset.defaultBox.x + 12}%`,
            top: `${currentPreset.defaultBox.y + 15}%`,
            width: `${currentPreset.defaultBox.width * sizeScale * scaleFactor}%`
          }}
        >
          {/* Framed Poster Box */}
          <div className={`relative w-full aspect-[2/3] rounded-sm overflow-hidden bg-black ${getFrameStyles()}`}>
            <img
              src={customImagePreview}
              alt="Custom Poster Wall View"
              className="w-full h-full object-cover"
            />
            {/* Glossy Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
          </div>
        </div>

        {/* Badge Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentPreset.name} • {selectedSize} Size</span>
        </div>
      </div>

      {/* Scale & Reset Controls */}
      <div className="flex items-center justify-between text-xs text-white/60 pt-1">
        <div className="flex items-center gap-2">
          <span>Scale:</span>
          <button
            onClick={() => setScaleFactor((s) => Math.max(0.7, s - 0.1))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white"
          >
            -
          </button>
          <span className="font-mono text-white font-medium">{Math.round(scaleFactor * 100)}%</span>
          <button
            onClick={() => setScaleFactor((s) => Math.min(1.4, s + 0.1))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setScaleFactor(1.0)}
          className="flex items-center gap-1 hover:text-amber-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset Scale
        </button>
      </div>
    </div>
  );
}
