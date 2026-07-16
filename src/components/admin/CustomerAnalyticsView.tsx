'use client';

import {
  Users, RefreshCcw, Activity
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#c8a96e', '#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#94a3b8'];

export function CustomerAnalyticsView({ analytics, totalCustomers }: { analytics: any, totalCustomers: number }) {
  const kpis = [
    { label: 'Total Customers', value: totalCustomers.toLocaleString(), icon: Users, color: 'text-luxe-accent' },
    { label: 'Returning Customer Rate', value: `${analytics.returningRate.toFixed(1)}%`, icon: RefreshCcw, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {/* Segment Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/50" />
            Customer Segments
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={analytics.segmentDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                strokeWidth={0}
              >
                {analytics.segmentDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-white/50" />
            Loyalty Tiers
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={analytics.tierDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                strokeWidth={0}
              >
                {analytics.tierDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                formatter={(val: number) => [`${val} Customers`, 'Count']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
