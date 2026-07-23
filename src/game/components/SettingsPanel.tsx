import React from 'react';
import { SaveData } from '../engine/types';

interface SettingsPanelProps {
  save: SaveData;
  onSave: (s: SaveData) => void;
  onBack: () => void;
}

export function SettingsPanel({ save, onSave, onBack }: SettingsPanelProps) {
  const toggleSound = () => onSave({ ...save, soundOn: !save.soundOn });
  const toggleColorBlind = () => onSave({ ...save, settings: { ...save.settings, colorBlind: !save.settings.colorBlind } });
  const toggleMotion = () => onSave({ ...save, settings: { ...save.settings, reducedMotion: !save.settings.reducedMotion } });

  return (
    <div className="w-full max-w-[360px] mx-auto pb-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-white/50 text-sm hover:text-white transition-colors">← Back</button>
        <h2 className="text-xl font-black text-white tracking-wider">SETTINGS</h2>
        <div className="w-10"></div>
      </div>

      <div className="space-y-4">
        {/* Sound Toggle */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Sound Effects</h3>
            <p className="text-[10px] text-white/40">Game sounds and music.</p>
          </div>
          <button onClick={toggleSound} className={`w-12 h-6 rounded-full transition-all relative ${save.soundOn ? 'bg-[#00f2fe]' : 'bg-white/20'}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${save.soundOn ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        
        {/* Colorblind Toggle */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Colorblind Mode</h3>
            <p className="text-[10px] text-white/40">Adds distinct shapes to gems.</p>
          </div>
          <button onClick={toggleColorBlind} className={`w-12 h-6 rounded-full transition-all relative ${save.settings?.colorBlind ? 'bg-[#00f2fe]' : 'bg-white/20'}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${save.settings?.colorBlind ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Reduced Motion</h3>
            <p className="text-[10px] text-white/40">Disables idle shaking and bouncy animations.</p>
          </div>
          <button onClick={toggleMotion} className={`w-12 h-6 rounded-full transition-all relative ${save.settings?.reducedMotion ? 'bg-[#00f2fe]' : 'bg-white/20'}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${save.settings?.reducedMotion ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
