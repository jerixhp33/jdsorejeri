import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AttributesEditorProps {
  attributes: Record<string, string>;
  onChange: (newAttributes: Record<string, string>) => void;
}

export function AttributesEditor({ attributes, onChange }: AttributesEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const entries = Object.entries(attributes);

  const handleAdd = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    onChange({ ...attributes, [newKey.trim()]: newValue.trim() });
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (keyToRemove: string) => {
    const next = { ...attributes };
    delete next[keyToRemove];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Custom Attributes (Optional)</p>
        <p className="text-white/30 text-xs mb-3">Add any additional details like Color, Fabric, Size, etc.</p>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-4">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
              <div className="flex-1 text-sm text-white/70">
                <span className="font-semibold text-white/90">{key}:</span> {val}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(key)}
                className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                title="Remove attribute"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-white/50 text-[10px] uppercase tracking-wide mb-1 block">Name (e.g. Color)</label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="input-luxe text-sm py-1.5"
            placeholder="Attribute name"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
        </div>
        <div className="flex-1">
          <label className="text-white/50 text-[10px] uppercase tracking-wide mb-1 block">Value (e.g. Red)</label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="input-luxe text-sm py-1.5"
            placeholder="Attribute value"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          className="bg-white/10 hover:bg-white/20 text-white rounded-lg p-2 h-[38px] transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
