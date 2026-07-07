'use client';

import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  Users, ShoppingBag, Package, TrendingUp, DollarSign, ShoppingCart, Target,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { AnalyticsSummary, DailySales, Order } from '@/types';

interface AdminDashboardProps {
  summary: AnalyticsSummary;
  dailySales: DailySales[];
  topProducts: Array<{ product_id: string; name: string; total_sold: number; revenue: number }>;
  recentOrders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  packed: 'status-packed',
  ready: 'status-ready',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export function AdminDashboard({ summary, dailySales, topProducts, recentOrders }: AdminDashboardProps) {
  const stats = [
    { label: 'Total Users', value: summary.total_users.toLocaleString(), sub: `+${summary.today_users} today`, icon: Users, color: 'text-blue-400' },
    { label: 'Total Orders', value: summary.total_orders.toLocaleString(), sub: `+${summary.today_orders} today`, icon: ShoppingBag, color: 'text-green-400' },
    { label: 'Total Revenue', value: formatCurrency(summary.total_revenue), sub: `${formatCurrency(summary.today_revenue)} today`, icon: DollarSign, color: 'text-luxe-accent' },
    { label: 'Products', value: summary.total_products.toLocaleString(), sub: 'Active products', icon: Package, color: 'text-purple-400' },
    { label: 'Avg Order Value', value: formatCurrency(summary.average_order_value), sub: 'Per order', icon: TrendingUp, color: 'text-pink-400' },
    { label: 'Conversion Rate', value: `${summary.conversion_rate}%`, sub: 'Users → Orders', icon: Target, color: 'text-orange-400' },
  ];

  const chartData = dailySales.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-white/40 text-sm">Welcome back. Here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn('w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-white/25 text-xs">{stat.sub}</span>
            </div>
            <p className="font-display text-2xl font-bold text-white mb-0.5">{stat.value}</p>
            <p className="text-white/50 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-6">Revenue (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="revenue" stroke="#c8a96e" strokeWidth={2} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-5">Top Products by Revenue</h2>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.product_id} className="flex items-center gap-3">
                <span className="text-white/30 text-xs w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{product.name}</p>
                  <p className="text-white/40 text-xs">{product.total_sold} sold</p>
                </div>
                <p className="text-luxe-accent font-semibold text-sm">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Recent Orders</h2>
            <a href="/admin/orders" className="text-luxe-accent text-xs hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {recentOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">#{order.order_number}</p>
                  <p className="text-white/40 text-xs">{(order.user as any)?.name || 'Customer'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={STATUS_COLORS[order.status]}>{order.status}</span>
                  <p className="text-white text-sm">{formatCurrency(order.total)}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders bar chart */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-6">Daily Orders (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              formatter={(value: number) => [value, 'Orders']}
            />
            <Bar dataKey="orders" fill="#c8a96e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
