import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Props {
  attributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
}

export function AttributesSection({ attributes, onChange }: Props) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const updateAttribute = (key: string, value: string) => {
    onChange({ ...attributes, [key]: value });
  };

  const removeAttribute = (key: string) => {
    const next = { ...attributes };
    delete next[key];
    onChange(next);
  };

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      updateAttribute(newKey.trim(), newValue.trim());
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {Object.entries(attributes || {})
          .filter(([_, value]) => typeof value !== 'object')
          .map(([key, value]) => (
          <div key={key} className="flex gap-3 items-center">
            <input 
              type="text" 
              value={key} 
              disabled 
              className="input-luxe flex-1 opacity-50 bg-black/20"
            />
            <input 
              type="text" 
              value={value}
              onChange={(e) => updateAttribute(key, e.target.value)}
              className="input-luxe flex-[2] bg-black/20"
            />
            <button 
              onClick={() => removeAttribute(key)}
              className="p-3 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center pt-4 border-t border-white/10">
        <input 
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Name (e.g. Material)"
          className="input-luxe flex-1 bg-black/20"
        />
        <input 
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value (e.g. Solid Gold)"
          className="input-luxe flex-[2] bg-black/20"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          className="p-3 bg-luxe-accent text-black disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 rounded-xl transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
