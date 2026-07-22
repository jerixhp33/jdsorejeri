import { useState } from 'react';
import { VariantOption, VariantCombination } from './types';
import { Plus, X, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  options: VariantOption[];
  combinations: VariantCombination[];
  basePrice: number;
  onChange: (options: VariantOption[], combinations: VariantCombination[]) => void;
}

export function VariantSection({ options, combinations, basePrice, onChange }: Props) {
  const [newOptionName, setNewOptionName] = useState('');

  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    const newOptions = [...options, { id: uuidv4(), name: newOptionName.trim(), values: [] }];
    onChange(newOptions, combinations);
    setNewOptionName('');
  };

  const handleRemoveOption = (optionId: string) => {
    const newOptions = options.filter(o => o.id !== optionId);
    onChange(newOptions, combinations);
  };

  const handleAddValue = (optionId: string, value: string) => {
    if (!value.trim()) return;
    const newOptions = options.map(opt => {
      if (opt.id === optionId && !opt.values.includes(value.trim())) {
        return { ...opt, values: [...opt.values, value.trim()] };
      }
      return opt;
    });
    onChange(newOptions, combinations);
  };

  const handleRemoveValue = (optionId: string, value: string) => {
    const newOptions = options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, values: opt.values.filter(v => v !== value) };
      }
      return opt;
    });
    onChange(newOptions, combinations);
  };

  const generateCombinations = () => {
    if (options.length === 0) {
      onChange(options, []);
      return;
    }

    const generate = (idx: number, currentOpt: Record<string, string>): Record<string, string>[] => {
      if (idx === options.length) return [currentOpt];
      
      const option = options[idx];
      if (option.values.length === 0) return generate(idx + 1, currentOpt);
      
      let res: Record<string, string>[] = [];
      for (const val of option.values) {
        res = res.concat(generate(idx + 1, { ...currentOpt, [option.name]: val }));
      }
      return res;
    };

    const newCombosRaw = generate(0, {});
    
    const newCombinations: VariantCombination[] = newCombosRaw.map(combo => {
      const existing = combinations.find(ec => 
        Object.entries(combo).every(([k, v]) => ec.options[k] === v) &&
        Object.keys(ec.options).length === Object.keys(combo).length
      );

      if (existing) return existing;

      return {
        id: uuidv4(),
        options: combo,
        price: basePrice || 0,
        stock: 0,
        sku: '',
        is_active: true
      };
    });

    onChange(options, newCombinations);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-white/80 font-medium text-sm">Variant Options</h4>
        
        {options.map(opt => (
          <div key={opt.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
              <span className="text-white font-medium">{opt.name}</span>
              <button onClick={() => handleRemoveOption(opt.id)} className="text-white/30 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {opt.values.map(val => (
                <span key={val} className="badge-luxe flex items-center gap-1">
                  {val}
                  <button onClick={() => handleRemoveValue(opt.id, val)} className="hover:text-red-400 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            
            <input 
              type="text"
              placeholder={`Add ${opt.name} value and press Enter...`}
              className="input-luxe text-sm w-full bg-black/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddValue(opt.id, e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        ))}

        <div className="flex gap-2">
          <input 
            type="text"
            value={newOptionName}
            onChange={e => setNewOptionName(e.target.value)}
            placeholder="New option (e.g. Size)"
            className="input-luxe text-sm flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
          />
          <button onClick={handleAddOption} className="btn-luxe-outline text-sm px-4">
            Add Option
          </button>
        </div>
      </div>

      {options.some(o => o.values.length > 0) && (
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="text-white/80 font-medium text-sm">Combinations</h4>
            <button onClick={generateCombinations} className="btn-gold text-xs px-3 py-1.5">
              Generate / Update Combinations
            </button>
          </div>
          
          {combinations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/70">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 font-medium">Variant</th>
                    <th className="py-2 font-medium w-24">Price (₹)</th>
                    <th className="py-2 font-medium w-24">Stock</th>
                    <th className="py-2 font-medium w-32">SKU</th>
                    <th className="py-2 font-medium w-16 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combo, idx) => (
                    <tr key={combo.id} className="border-b border-white/5">
                      <td className="py-2">
                        {Object.entries(combo.options).map(([k, v]) => `${v}`).join(' / ')}
                      </td>
                      <td className="py-2 pr-2">
                        <input 
                          type="number" 
                          value={combo.price ?? 0} 
                          onChange={(e) => {
                            const newCombos = [...combinations];
                            newCombos[idx].price = Number(e.target.value);
                            onChange(options, newCombos);
                          }}
                          className="input-luxe w-full px-2 py-1 text-xs bg-black/20"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input 
                          type="number" 
                          value={combo.stock ?? 0} 
                          onChange={(e) => {
                            const newCombos = [...combinations];
                            newCombos[idx].stock = Number(e.target.value);
                            onChange(options, newCombos);
                          }}
                          className="input-luxe w-full px-2 py-1 text-xs bg-black/20"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input 
                          type="text" 
                          value={combo.sku ?? ''} 
                          onChange={(e) => {
                            const newCombos = [...combinations];
                            newCombos[idx].sku = e.target.value;
                            onChange(options, newCombos);
                          }}
                          className="input-luxe w-full px-2 py-1 text-xs bg-black/20"
                          placeholder="Auto"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input 
                          type="checkbox" 
                          checked={combo.is_active !== false}
                          onChange={(e) => {
                            const newCombos = [...combinations];
                            newCombos[idx].is_active = e.target.checked;
                            onChange(options, newCombos);
                          }}
                          className="w-4 h-4 accent-luxe-accent"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-white/30 text-xs italic">Click 'Generate Combinations' to create editable variants.</p>
          )}
        </div>
      )}
    </div>
  );
}
