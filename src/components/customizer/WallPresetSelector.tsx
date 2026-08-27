'use client';

export interface RoomPreset {
  id: 'living' | 'bedroom' | 'office' | 'study';
  name: string;
  image: string;
  defaultBox: { x: number; y: number; width: number; height: number };
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'living',
    name: 'Living Room',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    defaultBox: { x: 38, y: 22, width: 24, height: 35 }
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    defaultBox: { x: 36, y: 18, width: 26, height: 38 }
  },
  {
    id: 'office',
    name: 'Office',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    defaultBox: { x: 40, y: 20, width: 22, height: 34 }
  },
  {
    id: 'study',
    name: 'Study Room',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    defaultBox: { x: 37, y: 25, width: 25, height: 36 }
  }
];

interface WallPresetSelectorProps {
  selectedPreset: string;
  onSelectPreset: (preset: RoomPreset) => void;
}

export function WallPresetSelector({ selectedPreset, onSelectPreset }: WallPresetSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {ROOM_PRESETS.map((preset) => {
        const isActive = selectedPreset === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 border ${
              isActive
                ? 'bg-amber-400 text-black border-amber-400 font-semibold shadow-lg shadow-amber-400/20'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="w-5 h-5 rounded-md overflow-hidden bg-black flex-shrink-0">
              <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
            </div>
            <span>{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
}
