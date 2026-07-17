'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Download, Users, TrendingUp, Star, ShieldAlert, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Customer } from '@/types';

import { CustomerAnalyticsService } from '@/lib/customer-analytics';

export function CustomerDashboardView({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dynamically calculate Customer Segments and LTV
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => {
      const analytics = CustomerAnalyticsService.calculate(c.orders);
      return { 
        ...c, 
        ltv: analytics.lifetimeValue, 
        totalOrders: analytics.totalOrders, 
        segment: analytics.segment, 
        lastOrder: analytics.lastOrderDate ? { created_at: analytics.lastOrderDate.toISOString() } : null 
      };
    });
  }, [customers]);

  const kpis = useMemo(() => {
    let total = enrichedCustomers.length;
    let newThisMonth = 0;
    let active = 0;
    let vip = 0;
    let atRisk = 0;
    let totalLTV = 0;
    let totalOrders = 0;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    enrichedCustomers.forEach(c => {
      if (new Date(c.created_at) > oneMonthAgo) newThisMonth++;
      if (c.segment !== 'Dormant' && c.segment !== 'At Risk') active++;
      if (c.segment === 'VIP') vip++;
      if (c.segment === 'At Risk') atRisk++;
      totalLTV += c.ltv;
      totalOrders += c.totalOrders;
    });

    return {
      total,
      newThisMonth,
      active,
      returning: total - newThisMonth - atRisk - vip, // rough estimate
      vip,
      atRisk,
      avgLTV: total > 0 ? totalLTV / total : 0,
      avgAOV: totalOrders > 0 ? totalLTV / totalOrders : 0
    };
  }, [enrichedCustomers]);

  const filtered = enrichedCustomers.filter(c => {
    const matchesSearch = !search ||
      c.user_profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_number?.toLowerCase().includes(search.toLowerCase());
    const matchesSegment = filterSegment === 'all' || c.segment.toLowerCase() === filterSegment.toLowerCase();
    return matchesSearch && matchesSegment;
  });

  const toggleAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(c => c.id)));
  };

  const exportToCSV = () => {
    const headers = ['Customer ID', 'Name', 'Email', 'Segment', 'Tier', 'Orders', 'LTV', 'Last Order'];
    const rows = filtered.map(c => [
      c.customer_number || '',
      c.user_profile?.name || '',
      c.user_profile?.email || '',
      c.segment || '',
      c.membership_tier || '',
      c.totalOrders || 0,
      c.ltv || 0,
      c.lastOrder ? new Date(c.lastOrder.created_at).toISOString() : ''
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Customer CRM</h1>
          <p className="text-white/50 text-sm mt-1">Manage profiles, analyze segments, and track LTV</p>
        </div>
        <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <div className="glass-card p-3 rounded-xl border border-white/5">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-bold text-white">{kpis.total}</p>
        </div>
        <div className="glass-card p-3 rounded-xl border border-white/5">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">New (30d)</p>
          <p className="text-xl font-bold text-emerald-400">+{kpis.newThisMonth}</p>
        </div>
        <div className="glass-card p-3 rounded-xl border border-white/5">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Active</p>
          <p className="text-xl font-bold text-blue-400">{kpis.active}</p>
        </div>
        <div className="glass-card p-3 rounded-xl border border-white/5">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">VIP</p>
          <p className="text-xl font-bold text-luxe-accent">{kpis.vip}</p>
        </div>
        <div className="glass-card p-3 rounded-xl border border-white/5">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">At Risk</p>
          <p className="text-xl font-bold text-amber-400">{kpis.atRisk}</p>
        </div>
        <div className="glass-card p-3 rounded-xl border border-white/5 col-span-3">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Avg LTV</p>
              <p className="text-xl font-bold text-white">{formatCurrency(kpis.avgLTV)}</p>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Avg Order Value</p>
              <p className="text-xl font-bold text-white">{formatCurrency(kpis.avgAOV)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search Name, Email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-luxe pl-9 text-sm w-full"
            />
          </div>
          
          <select 
            value={filterSegment} 
            onChange={(e) => setFilterSegment(e.target.value)}
            className="input-luxe text-sm py-2 px-3 bg-luxe-dark border-white/10"
          >
            <option value="all">All Segments</option>
            <option value="vip">VIP</option>
            <option value="returning">Returning</option>
            <option value="new">New</option>
            <option value="at risk">At Risk</option>
            <option value="dormant">Dormant</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-4 text-left w-12">
                  <input type="checkbox" className="rounded border-white/20 bg-white/5 accent-luxe-accent cursor-pointer" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Customer</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Segment</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Tier</th>
                <th className="px-4 py-4 text-right text-white/40 text-xs uppercase tracking-wider font-semibold">Orders</th>
                <th className="px-4 py-4 text-right text-white/40 text-xs uppercase tracking-wider font-semibold">LTV</th>
                <th className="px-4 py-4 text-right text-white/40 text-xs uppercase tracking-wider font-semibold">Last Order</th>
                <th className="px-4 py-4 text-right text-white/40 text-xs uppercase tracking-wider font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-white/30 text-sm">No customers match your criteria.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded border-white/20 bg-white/5 accent-luxe-accent cursor-pointer" checked={selectedIds.has(c.id)} onChange={() => {
                        const newSet = new Set(selectedIds);
                        newSet.has(c.id) ? newSet.delete(c.id) : newSet.add(c.id);
                        setSelectedIds(newSet);
                      }} />
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/customers/${c.id}`} className="text-white font-medium hover:text-luxe-accent transition-colors block">
                        {c.user_profile?.name || 'Unknown'}
                      </Link>
                      <p className="text-white/40 text-xs mt-0.5">{c.user_profile?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider",
                        c.segment === 'VIP' ? "bg-luxe-accent/10 text-luxe-accent" :
                        c.segment === 'New' ? "bg-emerald-500/10 text-emerald-400" :
                        c.segment === 'At Risk' ? "bg-amber-500/10 text-amber-400" :
                        "bg-blue-500/10 text-blue-400"
                      )}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/70 text-sm capitalize">
                      {c.membership_tier}
                    </td>
                    <td className="px-4 py-4 text-right text-white font-medium">
                      {c.totalOrders}
                    </td>
                    <td className="px-4 py-4 text-right text-white font-semibold">
                      {formatCurrency(c.ltv)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-white/70 text-sm">{c.lastOrder ? formatDate(c.lastOrder.created_at) : 'Never'}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link 
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        Profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
