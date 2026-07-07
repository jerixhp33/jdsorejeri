'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order, OrderStatus } from '@/types';

const STATUSES: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'ready',
  ready: 'delivered',
};

export function AdminOrdersView({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.user as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (o.user as any)?.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus, updated_at: new Date().toISOString() }),
      });
      const result = await res.json();

      if (!res.ok || result?.error) {
        toast.error('Failed to update status');
      } else {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));

        // Notify user
        const order = orders.find(o => o.id === orderId);
        if (order?.user_id) {
          const messages: Partial<Record<OrderStatus, string>> = {
            confirmed: 'Your order has been confirmed! 🎉',
            packed: 'Your order is packed and ready for dispatch.',
            ready: 'Your order is out for delivery! 🚚',
            delivered: 'Your order has been delivered. Enjoy! 😊',
          };
          if (messages[newStatus]) {
            await fetch('/api/admin/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: order.user_id,
                title: `Order #${order.order_number} Update`,
                body: messages[newStatus],
                type: 'order',
                action_url: `/dashboard/orders`,
              }),
            });
          }
        }
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
    setUpdatingId(null);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    await updateStatus(orderId, 'cancelled');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
        <span className="badge-luxe">{orders.length} total</span>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-luxe pl-9 text-sm w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === s.value
                  ? 'bg-luxe-accent text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Order', 'Customer', 'Items', 'District', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-white/40 text-xs uppercase tracking-wide font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-white/30 text-sm">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">#{order.order_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{(order.user as any)?.name || '—'}</p>
                      <p className="text-white/40 text-xs">{(order.user as any)?.phone || (order.user as any)?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/70 text-sm">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/70 text-sm">{(order.delivery_address as any)?.district || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold text-sm">{formatCurrency(order.total)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('status-' + order.status)}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/50 text-xs">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {NEXT_STATUS[order.status as OrderStatus] && (
                          <button
                            onClick={() => updateStatus(order.id, NEXT_STATUS[order.status as OrderStatus]!)}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 rounded-lg bg-luxe-accent/20 text-luxe-accent text-xs hover:bg-luxe-accent/30 transition-all disabled:opacity-50"
                          >
                            {updatingId === order.id ? '...' : `Mark ${NEXT_STATUS[order.status as OrderStatus]}`}
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                        {/* WhatsApp contact */}
                        {(order.user as any)?.phone && (
                          <a
                            href={`https://wa.me/91${(order.user as any).phone}?text=${encodeURIComponent(`Hi! Regarding your order #${order.order_number}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-all"
                            title="Contact via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
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
