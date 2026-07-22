import React from 'react';
import { Layers } from 'lucide-react';

interface CrossSellsSectionProps {
  crossSells: string[];
  onChange: (value: string[]) => void;
  allProducts: { id: string; name: string }[];
}

export function CrossSellsSection({ crossSells = [], onChange, allProducts }: CrossSellsSectionProps) {
  const toggleCrossSell = (productId: string) => {
    if (crossSells.includes(productId)) {
      onChange(crossSells.filter(id => id !== productId));
    } else {
      onChange([...crossSells, productId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-medium text-white">Cross-Sells (Frequently Bought Together)</h3>
      </div>
      <p className="text-sm text-white/60 mb-6">
        Select products that complement this item. These will be displayed as "Frequently Bought Together" or "You Might Also Like" on the product page.
      </p>

      <div className="glass-card p-4">
        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
          {allProducts.length === 0 ? (
            <p className="text-white/40 text-sm py-4">No other products available.</p>
          ) : (
            allProducts.map((product) => {
              const isSelected = crossSells.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleCrossSell(product.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-amber-400/10 border-amber-400/50' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm text-white">{product.name}</span>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-amber-400 border-amber-400' : 'border-white/30'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
