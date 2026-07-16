'use client';

import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  Users, ShoppingBag, Package, TrendingUp, DollarSign, Target, Clock, AlertTriangle, RefreshCcw, Banknote
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';
import type { AnalyticsSummary, DailySales, Order } from '@/types';

interface AdminDashboardProps {
  summary: AnalyticsSummary;
  dailySales: DailySales[];
  topProducts: Array<{ product_id: string; name: string; total_sold: number; revenue: number }>;
  recentOrders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'status-pending',
  confirmed: 'status-confirmed',
  packed:    'status-packed',
  ready:     'status-ready',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export function AdminDashboard({ summary, dailySales, topProducts, recentOrders }: AdminDashboardProps) {
  const stats = [
    { label: 'Revenue Today',     value: formatCurrency(summary.today_revenue),     sub: 'Gross sales',                          icon: DollarSign,  color: 'text-luxe-accent' },
    { label: 'Orders Today',      value: summary.today_orders.toLocaleString(),     sub: 'Total orders placed',                  icon: ShoppingBag, color: 'text-green-400' },
    { label: 'Profit Today',      value: formatCurrency(summary.today_profit),      sub: 'Est. 40% margin',                      icon: Banknote,    color: 'text-blue-400' },
    { label: 'Pending Orders',    value: summary.pending_orders.toLocaleString(),   sub: 'Awaiting fulfillment',                 icon: Clock,       color: 'text-orange-400' },
    { label: 'Active Customers',  value: summary.active_customers.toLocaleString(), sub: 'In CRM Database',                      icon: Users,       color: 'text-purple-400' },
    { label: 'Inventory Alerts',  value: summary.inventory_alerts.toLocaleString(), sub: 'Low stock items',                      icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Returns',           value: summary.returns_count.toLocaleString(),    sub: 'Total returned',                       icon: RefreshCcw,  color: 'text-amber-400' },
    { label: 'Refunds',           value: summary.refunds_count.toLocaleString(),    sub: 'Total refunded',                       icon: TrendingUp,  color: 'text-pink-400' },
  ];

  const chartData = dailySales.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div className="space-y-5 md:space-y-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">Executive Dashboard</h1>
        <p className="text-white/40 text-sm">Welcome back. Here's how your business is doing today.</p>
      </div>

      {/* Stat cards — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-3.5 md:p-5"
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className={cn('w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center', stat.color)}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-white/25 text-[10px] md:text-xs hidden sm:block">{stat.sub}</span>
            </div>
            <p className="font-display text-lg md:text-2xl font-bold text-white mb-0.5">{stat.value}</p>
            <p className="text-white/50 text-[11px] md:text-sm">{stat.label}</p>
            {/* sub on mobile below */}
            <p className="text-white/25 text-[10px] mt-1 sm:hidden">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-4 md:p-6">
        <h2 className="text-white font-semibold text-sm md:text-base mb-4 md:mb-6">Revenue (Last 14 Days)</h2>
        <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0">
          <div style={{ minWidth: 280 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8a96e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c8a96e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#c8a96e" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Products */}
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-white font-semibold text-sm md:text-base mb-4 md:mb-5">Top Products by Revenue</h2>
          <div className="space-y-2.5 md:space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.product_id} className="flex items-center gap-2 md:gap-3">
                <span className="text-white/30 text-xs w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs md:text-sm truncate">{product.name}</p>
                  <p className="text-white/40 text-[11px]">{product.total_sold} sold</p>
                </div>
                <p className="text-luxe-accent font-semibold text-xs md:text-sm flex-shrink-0">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-white/30 text-sm text-center py-6">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 text-sm font-medium">Recent Orders</h3>
            <Link prefetch={true} href="/admin/orders" className="text-luxe-accent text-xs hover:underline">View all →</Link>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {recentOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-xs md:text-sm font-medium truncate">#{order.order_number}</p>
                  <p className="text-white/40 text-[11px] truncate">{(order.user as any)?.name || 'Customer'}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={STATUS_COLORS[order.status]}>{order.status}</span>
                  <p className="text-white text-xs md:text-sm">{formatCurrency(order.total)}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-white/30 text-sm text-center py-6">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders bar chart */}
      <div className="glass-card p-4 md:p-6">
        <h2 className="text-white font-semibold text-sm md:text-base mb-4 md:mb-6">Daily Orders (Last 14 Days)</h2>
        <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0">
          <div style={{ minWidth: 280 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Bar dataKey="orders" fill="#c8a96e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}