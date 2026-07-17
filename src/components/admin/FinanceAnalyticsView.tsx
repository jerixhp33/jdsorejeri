'use client';

import { DollarSign, TrendingUp, TrendingDown, Receipt, Truck, CreditCard } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function FinanceAnalyticsView({ data }: { data: any }) {
  const chartData = [
    { name: 'Gross Revenue', value: data.grossRevenue, fill: '#4ade80' },
    { name: 'Discounts', value: -data.discounts, fill: '#fb923c' },
    { name: 'Shipping (Net)', value: data.shippingIncome - data.shippingExpense, fill: '#60a5fa' },
    { name: 'Refunds', value: -data.refunds, fill: '#f87171' },
    { name: 'Net Revenue', value: data.netRevenue, fill: '#c8a96e' },
    { name: 'Est. Profit', value: data.estimatedProfit, fill: '#a78bfa' }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Waterfall / Bar Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white/50" />
            Financial Breakdown (30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                formatter={(val: number) => [formatCurrency(val), 'Amount']}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ledger Summary */}
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-white font-semibold mb-4">P&L Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Gross Revenue</span>
              <span className="text-white font-medium">{formatCurrency(data.grossRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-amber-400/80">- Discounts</span>
              <span className="text-amber-400 font-medium">-{formatCurrency(data.discounts)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-400/80">+ Shipping Income</span>
              <span className="text-blue-400 font-medium">{formatCurrency(data.shippingIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-400/80">- Refunds</span>
              <span className="text-red-400 font-medium">-{formatCurrency(data.refunds)}</span>
            </div>
            
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-white font-semibold">Net Revenue</span>
              <span className="text-luxe-accent font-bold text-lg">{formatCurrency(data.netRevenue)}</span>
            </div>

            <div className="flex justify-between items-center text-sm pt-4">
              <span className="text-white/60">Estimated COGS</span>
              <span className="text-white/60">-{formatCurrency(data.grossRevenue * 0.6)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Shipping Expense</span>
              <span className="text-white/60">-{formatCurrency(data.shippingExpense)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Taxes (GST)</span>
              <span className="text-white/60">-{formatCurrency(data.taxes)}</span>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-white font-semibold">Estimated Profit</span>
              <span className={cn("font-bold text-lg", data.estimatedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                {formatCurrency(data.estimatedProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
