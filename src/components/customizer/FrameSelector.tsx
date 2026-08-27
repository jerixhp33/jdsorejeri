'use client';

export interface FrameOption {
  id: string;
  name: string;
  priceAddon: number;
  colorClass: string;
}

const DEFAULT_FRAMES: FrameOption[] = [
  { id: 'none', name: 'No Frame (Print Only)', priceAddon: 0, colorClass: 'bg-transparent border-dashed border-white/30' },
  { id: 'black', name: 'Black Wooden Frame', priceAddon: 150, colorClass: 'bg-neutral-900 border-neutral-950' },
  { id: 'white', name: 'White Wooden Frame', priceAddon: 150, colorClass: 'bg-stone-100 border-stone-300' },
  { id: 'wood', name: 'Natural Oak Frame', priceAddon: 200, colorClass: 'bg-[#8B5A2B] border-[#5c3a1b]' }
];

interface FrameSelectorProps {
  selectedFrame: string;
  onSelectFrame: (frame: string) => void;
  frames: FrameOption[];
}

export function FrameSelector({
  selectedFrame,
  onSelectFrame,
  frames
}: FrameSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
        2. Select Framing Option
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {frames.map((f) => {
          const isSelected = selectedFrame === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFrame(f.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full border ${f.colorClass}`} />
                <span className="text-xs font-semibold text-white">{f.name}</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">
                {f.priceAddon > 0 ? `+₹${f.priceAddon}` : 'Included'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
