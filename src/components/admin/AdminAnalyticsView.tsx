'use client';

import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { AnalyticsSummary, DailySales } from '@/types';

interface AdminAnalyticsViewProps {
  summary: AnalyticsSummary;
  dailySales: DailySales[];
  topProducts: Array<{ product_id: string; name: string; total_sold: number; revenue: number }>;
  deviceAnalytics: Array<{ device: string; count: number }>;
}

const CHART_COLORS = ['#c8a96e', '#4ade80', '#60a5fa', '#f472b6', '#fb923c'];

export function AdminAnalyticsView({
  summary,
  dailySales,
  topProducts,
  deviceAnalytics,
}: AdminAnalyticsViewProps) {
  const [period, setPeriod] = useState<7 | 14 | 30>(30);

  const chartData = dailySales.slice(-period).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders,
  }));

  const totalPeriodRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalPeriodOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Revenue', 'Orders'],
      ...dailySales.map((d) => [d.date, d.revenue, d.orders]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luxe-sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-foreground/ text-foreground/ hover:text-foreground hover:border-foreground/ text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: summary.total_users.toLocaleString(), sub: `+${summary.today_users} today`, positive: true },
          { label: 'Total Orders', value: summary.total_orders.toLocaleString(), sub: `+${summary.today_orders} today`, positive: true },
          { label: 'Total Revenue', value: formatCurrency(summary.total_revenue), sub: `${formatCurrency(summary.today_revenue)} today`, positive: true },
          { label: 'Avg Order Value', value: formatCurrency(summary.average_order_value), sub: `${summary.conversion_rate}% conversion`, positive: summary.conversion_rate > 5 },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <p className="text-foreground/ text-xs uppercase tracking-wide mb-3">{stat.label}</p>
            <p className="font-display text-2xl font-bold text-foreground mb-1">{stat.value}</p>
            <div className="flex items-center gap-1 text-xs">
              {stat.positive ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={stat.positive ? 'text-green-400' : 'text-red-400'}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-foreground/ text-sm">Period:</span>
        {([7, 14, 30] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-luxe-accent text-black' : 'bg-foreground/ text-foreground/ hover:bg-foreground/'
            )}
          >
            {p} days
          </button>
        ))}
      </div>

      {/* Period totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="text-foreground/ text-xs mb-1">Revenue (last {period} days)</p>
          <p className="font-display text-xl font-bold text-luxe-accent">{formatCurrency(totalPeriodRevenue)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-foreground/ text-xs mb-1">Orders (last {period} days)</p>
          <p className="font-display text-xl font-bold text-foreground">{totalPeriodOrders}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="glass-card p-6">
        <h2 className="text-foreground font-semibold mb-6">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c8a96e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c8a96e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#c8a96e" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders bar chart */}
        <div className="glass-card p-6">
          <h2 className="text-foreground font-semibold mb-6">Daily Orders</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                formatter={(value: number) => [value, 'Orders']}
              />
              <Bar dataKey="orders" fill="#c8a96e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-foreground font-semibold mb-6">Device Breakdown</h2>
          {deviceAnalytics.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={deviceAnalytics} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                    {deviceAnalytics.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {deviceAnalytics.map((d, i) => (
                  <div key={d.device} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-foreground/ text-sm">{d.device}</span>
                    <span className="text-foreground/ text-xs">({d.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-foreground/ text-sm text-center py-12">No login data yet</p>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="glass-card p-6">
        <h2 className="text-foreground font-semibold mb-6">Top Products by Revenue</h2>
        <div className="space-y-4">
          {topProducts.map((product, i) => {
            const maxRevenue = topProducts[0]?.revenue || 1;
            const pct = (product.revenue / maxRevenue) * 100;
            return (
              <div key={product.product_id} className="flex items-center gap-4">
                <span className="text-foreground/ text-xs w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-foreground text-sm truncate">{product.name}</span>
                    <span className="text-luxe-accent text-sm font-semibold ml-2">{formatCurrency(product.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/ overflow-hidden">
                    <div className="h-full rounded-full bg-luxe-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-foreground/ text-xs mt-1">{product.total_sold} units sold</p>
                </div>
              </div>
            );
          })}
          {topProducts.length === 0 && (
            <p className="text-foreground/ text-sm text-center py-8">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
