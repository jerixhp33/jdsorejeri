'use client';

export interface PosterSizeOption {
  id: string;
  name: string;
  dimensionsMm: string;
  price: number;
}

const DEFAULT_SIZES: PosterSizeOption[] = [
  { id: 'A5', name: 'A5 Small', dimensionsMm: '148 × 210 mm', price: 199 },
  { id: 'A4', name: 'A4 Standard', dimensionsMm: '210 × 297 mm', price: 299 },
  { id: 'A3', name: 'A3 Large', dimensionsMm: '297 × 420 mm', price: 449 }
];

interface PosterSizeSelectorProps {
  selectedSize: string;
  onSelectSize: (size: string) => void;
  sizes: PosterSizeOption[];
}

export function PosterSizeSelector({
  selectedSize,
  onSelectSize,
  sizes
}: PosterSizeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
        1. Select Poster Size
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sizes.map((s) => {
          const isSelected = selectedSize === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSize(s.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{s.id}</span>
                <span className="font-mono text-xs font-semibold text-amber-400">₹{s.price}</span>
              </div>
              <p className="text-[11px] text-white/50 mt-1 font-mono">{s.dimensionsMm}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
