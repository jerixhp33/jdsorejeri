'use client';

import {
  Package, AlertTriangle, SearchX, Zap, TrendingUp
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import type { InventoryAnalytics } from '@/lib/inventory-analytics';

const COLORS = ['#c8a96e', '#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#94a3b8'];

export function InventoryAnalyticsView({ data }: { data: InventoryAnalytics }) {
  const kpis = [
    { label: 'Total Value', value: formatCurrency(data.totalValue), icon: TrendingUp, color: 'text-luxe-accent' },
    { label: 'Low Stock', value: data.lowStockCount, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Out of Stock', value: data.outOfStockCount, icon: SearchX, color: 'text-red-400' },
    { label: 'Dead Stock (90d)', value: data.deadStockCount, icon: Package, color: 'text-white/40' },
    { label: 'Fast Moving (30d)', value: data.fastMovingCount, icon: Zap, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card p-5">
            <div className="flex justify-between items-start mb-3">
              <k.icon className={cn("w-5 h-5", k.color)} />
            </div>
            <p className="font-display text-2xl font-bold text-white mb-1">{k.value}</p>
            <p className="text-white/50 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restock Recommendations */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-6">Restock Recommendations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/40 text-xs border-b border-white/5">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-right">Stock</th>
                  <th className="pb-3 font-medium text-right">30d Sales</th>
                  <th className="pb-3 font-medium text-right">Suggested Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.restockRecommendations.map(r => (
                  <tr key={r.id}>
                    <td className="py-3 text-sm text-white">{r.name}</td>
                    <td className="py-3 text-sm text-amber-400 font-semibold text-right">{r.stock}</td>
                    <td className="py-3 text-sm text-white/70 text-right">{r.velocity30d} units</td>
                    <td className="py-3 text-sm text-luxe-accent font-bold text-right">+{r.suggestedRestock}</td>
                  </tr>
                ))}
                {data.restockRecommendations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-white/40 text-sm">Inventory looks healthy! No immediate restocks needed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Value Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-6">Inventory Value by Category</h2>
          {data.categoryDistribution.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={240} className="flex-1">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={0}
                  >
                    {data.categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1 w-full max-h-[240px] overflow-y-auto pr-2 no-scrollbar">
                {data.categoryDistribution.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-white/70 text-sm truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <span className="text-white font-medium text-sm">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <p className="py-8 text-center text-white/40 text-sm">No category data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
