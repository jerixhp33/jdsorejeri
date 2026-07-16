import { useState } from 'react';
import { ProductFormData } from '../types';
import { Plus, X } from 'lucide-react';

interface Props {
  formData: ProductFormData;
  updateAttribute: (key: string, value: string) => void;
  removeAttribute: (key: string) => void;
}

export function AttributesSection({ formData, updateAttribute, removeAttribute }: Props) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

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
        {Object.entries(formData.attributes || {})
          .filter(([_, value]) => typeof value !== 'object')
          .map(([key, value]) => (
          <div key={key} className="flex gap-3 items-center">
            <input 
              type="text" 
              value={key} 
              disabled 
              className="input-luxe flex-1 opacity-50"
            />
            <input 
              type="text" 
              value={value}
              onChange={(e) => updateAttribute(key, e.target.value)}
              className="input-luxe flex-[2]"
            />
            <button 
              onClick={() => removeAttribute(key)}
              className="p-3 bg-foreground/ hover:bg-red-500/20 text-foreground/ hover:text-red-400 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center pt-4 border-t border-foreground/">
        <input 
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Name (e.g. Material)"
          className="input-luxe flex-1"
        />
        <input 
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value (e.g. Solid Gold)"
          className="input-luxe flex-[2]"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          className="p-3 bg-luxe-accent text-black disabled:opacity-50 disabled:bg-foreground/ disabled:text-foreground/ rounded-xl transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
