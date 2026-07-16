'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Download, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/orders';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/orders';
import { StatusSelect } from './StatusSelect';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const STATUSES = [
  { value: 'all', label: 'All Orders' },
  ...Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => ({ value: k as OrderStatus, label: v.label }))
];

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Payments' },
  ...Object.entries(PAYMENT_STATUS_CONFIG).map(([k, v]) => ({ value: k as PaymentStatus, label: v.label }))
];

export function AdminOrdersView({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<OrderStatus | ''>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Individual update functions
  const updateInlineStatus = async (id: string, newStatus: string, type: 'status' | 'payment_status') => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [type]: newStatus }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, [type]: newStatus } : o));
        toast.success(`Order ${type.replace('_', ' ')} updated`);
      } else {
        toast.error(`Failed to update ${type.replace('_', ' ')}`);
      }
    } catch (err) {
      toast.error(`Failed to update ${type.replace('_', ' ')}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayRevenue = 0;
    let todayOrders = 0;
    let pendingCount = 0;
    let packedCount = 0;
    let shippedCount = 0;

    orders.forEach(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      
      if (orderDate.getTime() === today.getTime()) {
        todayOrders++;
        todayRevenue += (o.grand_total || o.total || 0);
      }

      if (o.status === 'pending') pendingCount++;
      if (o.status === 'packed') packedCount++;
      if (o.status === 'shipped') shippedCount++;
    });

    return { todayRevenue, todayOrders, pendingCount, packedCount, shippedCount };
  }, [orders]);

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesPayment = paymentFilter === 'all' || (o.payment_status || 'pending') === paymentFilter;
    const matchesSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.user as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (o.user as any)?.email?.toLowerCase().includes(search.toLowerCase()) ||
      (o.delivery_address as any)?.phone?.includes(search);
    return matchesFilter && matchesPayment && matchesSearch;
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkActionStatus || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    let successCount = 0;
    
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: bulkActionStatus, updated_at: new Date().toISOString() }),
        });
        if (res.ok) {
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: bulkActionStatus } : o));
          successCount++;
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsBulkUpdating(false);
    setSelectedIds(new Set());
    setBulkActionStatus('');
    toast.success(`Updated ${successCount} orders to ${bulkActionStatus}`);
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No orders to export');
      return;
    }
    
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Email', 'Items', 'Subtotal', 'Tax', 'Shipping', 'Discount', 'Total', 'Status', 'Payment Status'];
    const rows = filtered.map(o => [
      o.order_number,
      new Date(o.created_at).toISOString(),
      (o.delivery_address as any)?.full_name || (o.user as any)?.name || '',
      (o.delivery_address as any)?.phone || (o.user as any)?.phone || '',
      (o.user as any)?.email || '',
      o.items?.length || 0,
      o.subtotal || 0,
      o.tax || 0,
      o.shipping_cost || 0,
      o.discount_amount || 0,
      o.grand_total || o.total || 0,
      o.status,
      o.payment_status || 'pending'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `jd_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Orders Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">Manage and track all store orders</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Today's Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(kpis.todayRevenue)}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/50 text-xs uppercase tracking-wider">Today's Orders</p>
            <Package className="w-4 h-4 text-white/30" />
          </div>
          <p className="text-2xl font-bold text-white">{kpis.todayOrders}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/50 text-xs uppercase tracking-wider">Pending</p>
            <Clock className="w-4 h-4 text-amber-400/50" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{kpis.pendingCount}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/50 text-xs uppercase tracking-wider">Packed</p>
            <CheckCircle className="w-4 h-4 text-blue-400/50" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{kpis.packedCount}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/50 text-xs uppercase tracking-wider">Shipped</p>
            <Truck className="w-4 h-4 text-purple-400/50" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{kpis.shippedCount}</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search ID, Customer, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-luxe pl-9 text-sm w-full"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
            className="input-luxe text-sm py-2 px-3 bg-luxe-dark border-white/10"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
            className="input-luxe text-sm py-2 px-3 bg-luxe-dark border-white/10"
          >
            {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        
        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-luxe-accent/10 border border-luxe-accent/20 rounded-lg p-1.5">
            <span className="text-luxe-accent text-xs font-medium px-2">{selectedIds.size} Selected</span>
            <select 
              value={bulkActionStatus} 
              onChange={e => setBulkActionStatus(e.target.value as OrderStatus)}
              className="input-luxe py-1 text-xs bg-black/50 border-white/10 outline-none focus:ring-0"
            >
              <option value="">Update Status...</option>
              {STATUSES.filter(s => s.value !== 'all').map(s => (
                <option key={s.value} value={s.value}>Mark as {s.label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={isBulkUpdating || !bulkActionStatus}
              className="px-3 py-1.5 text-xs font-semibold bg-luxe-accent text-black rounded-md hover:bg-white transition-all disabled:opacity-50"
            >
              {isBulkUpdating ? 'Saving...' : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* Orders Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-white/5 accent-luxe-accent cursor-pointer"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Order</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Date</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Customer</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Payment</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Total</th>
                <th className="px-4 py-4 text-left text-white/40 text-xs uppercase tracking-wider font-semibold">Status</th>
                <th className="px-4 py-4 text-right text-white/40 text-xs uppercase tracking-wider font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-white/30 text-sm">
                    No orders match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/5 accent-luxe-accent cursor-pointer"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelection(order.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-white font-medium hover:text-luxe-accent transition-colors block">
                        #{order.order_number}
                      </Link>
                      <p className="text-white/40 text-xs mt-0.5">{order.items?.length || 0} items</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white/70 text-sm">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white text-sm font-medium">{(order.delivery_address as any)?.full_name || (order.user as any)?.name || 'Unknown'}</p>
                      <p className="text-white/40 text-xs mt-0.5">{(order.delivery_address as any)?.phone || (order.user as any)?.phone || (order.user as any)?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-full max-w-[120px]">
                        <StatusSelect
                          type="payment"
                          value={order.payment_status || 'pending'}
                          onChange={(val) => updateInlineStatus(order.id, val as PaymentStatus, 'payment_status')}
                          disabled={updatingIds.has(order.id)}
                          isUpdating={updatingIds.has(order.id)}
                          options={PAYMENT_STATUSES}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-semibold text-sm">{formatCurrency(order.grand_total || order.total || 0)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-full max-w-[130px]">
                        <StatusSelect
                          type="order"
                          value={order.status}
                          onChange={(val) => updateInlineStatus(order.id, val as OrderStatus, 'status')}
                          disabled={updatingIds.has(order.id)}
                          isUpdating={updatingIds.has(order.id)}
                          options={STATUSES}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-all"
                      >
                        Details
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
