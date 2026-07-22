'use client';

import { formatCurrency, cn } from '@/lib/utils';
import { Target } from 'lucide-react';

export interface ProductPerformance {
  id: string;
  name: string;
  volumeSold: number;
  grossRevenue: number;
  totalCogs: number;
  grossProfit: number;
  netMarginPct: number;
  classification: string;
}

export function ProductPerformanceMatrix({ data }: { data: ProductPerformance[] }) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Cash Cow': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'Dead Weight': return 'bg-red-400/10 text-red-400 border-red-400/20';
      case 'Volume / Low Margin': return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'Niche / High Margin': return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
      default: return 'bg-white/5 text-white/70 border-white/10';
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
        <Target className="w-4 h-4 text-white/50" />
        Product Performance Matrix (30 Days)
      </h2>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="text-white/40 text-xs border-b border-white/5">
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 font-medium text-right">Volume</th>
              <th className="pb-3 font-medium text-right">Revenue</th>
              <th className="pb-3 font-medium text-right">Gross Profit</th>
              <th className="pb-3 font-medium text-right">Margin %</th>
              <th className="pb-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 text-sm text-white font-medium">{p.name}</td>
                <td className="py-4 text-sm text-white/70 text-right">{p.volumeSold}</td>
                <td className="py-4 text-sm text-white/70 text-right">{formatCurrency(p.grossRevenue)}</td>
                <td className="py-4 text-sm text-white font-semibold text-right">{formatCurrency(p.grossProfit)}</td>
                <td className="py-4 text-sm text-right">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    p.netMarginPct >= 40 ? "text-emerald-400 bg-emerald-400/10" : 
                    p.netMarginPct < 20 ? "text-red-400 bg-red-400/10" : 
                    "text-blue-400 bg-blue-400/10"
                  )}>
                    {p.netMarginPct.toFixed(1)}%
                  </span>
                </td>
                <td className="py-4 text-sm text-right">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs border", getClassificationColor(p.classification))}>
                    {p.classification}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-white/40 text-sm">
                  No sales data available for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
