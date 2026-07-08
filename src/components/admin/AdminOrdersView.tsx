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
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

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
    <>
      <div className="space-y-6 print:hidden">
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
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        {/* Print Receipt Button */}
                        {order.status !== 'cancelled' && (
                          <button
                            onClick={() => handlePrint(order)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"
                            title="Download PDF Receipt"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          </button>
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

      {/* Printable Receipt for Admin (Hidden on Screen, Visible on Print) */}
      {printingOrder && (
        <div className="hidden print-receipt-container bg-white text-black p-8 min-h-screen">
          <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
            <h1 className="text-4xl font-serif font-bold text-black tracking-tight mb-2">JD Store</h1>
            <p className="text-gray-500 font-medium tracking-wide">OFFICIAL ORDER RECEIPT</p>
          </div>
          
          <div className="flex justify-between mb-10">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black uppercase tracking-wider text-xs">Billed To</h3>
              <p className="font-semibold text-lg text-black">{(printingOrder.delivery_address as any)?.full_name || (printingOrder.user as any)?.name}</p>
              <p className="text-gray-700">{(printingOrder.delivery_address as any)?.phone || (printingOrder.user as any)?.phone}</p>
              <p className="max-w-xs text-gray-700 mt-1">
                {[(printingOrder.delivery_address as any)?.house_no, (printingOrder.delivery_address as any)?.street, (printingOrder.delivery_address as any)?.area, (printingOrder.delivery_address as any)?.city, (printingOrder.delivery_address as any)?.district, (printingOrder.delivery_address as any)?.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-lg mb-2 text-black uppercase tracking-wider text-xs">Order Info</h3>
              <p className="text-gray-700">Order ID: <strong className="text-black">#{printingOrder.order_number}</strong></p>
              <p className="text-gray-700">Date: <span className="font-medium text-black">{new Date(printingOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
              <p className="text-gray-700">Status: <span className="text-amber-600 font-semibold uppercase">{printingOrder.status}</span></p>
            </div>
          </div>

          <table className="w-full text-left mb-10 border-collapse">
            <thead>
              <tr className="border-b-2 border-black/80">
                <th className="py-3 text-black uppercase text-xs tracking-wider font-bold w-[50%]">Item Description</th>
                <th className="py-3 text-center text-black uppercase text-xs tracking-wider font-bold">Qty</th>
                <th className="py-3 text-right text-black uppercase text-xs tracking-wider font-bold">Price</th>
                <th className="py-3 text-right text-black uppercase text-xs tracking-wider font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {printingOrder.items?.map((item: any, idx: number) => {
                const img = item.product?.images?.[0]?.url;
                return (
                  <tr key={idx} className="border-b border-gray-200/60">
                    <td className="py-5 pr-4">
                      <div className="flex items-center gap-4">
                        {img && (
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            <img src={img} alt={item.product?.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-base text-black leading-snug">{item.product?.name || 'Item'}</p>
                          {item.poster_size?.label && <p className="text-sm text-gray-500 mt-0.5">Size: {item.poster_size.label}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-center text-black font-medium">{item.quantity}</td>
                    <td className="py-5 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                    <td className="py-5 text-right font-bold text-black">{formatCurrency(item.total_price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-72 space-y-3 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center text-gray-600 text-sm">
                <span>Subtotal</span>
                <span className="font-medium text-black">{formatCurrency(printingOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 text-sm">
                <span>Delivery</span>
                <span className="font-medium text-black">{printingOrder.delivery_charge === 0 ? 'FREE' : formatCurrency(printingOrder.delivery_charge)}</span>
              </div>
              {(printingOrder.discount_amount || 0) > 0 && (
                <div className="flex justify-between items-center text-green-600 text-sm font-medium">
                  <span>Discount</span>
                  <span>-{formatCurrency(printingOrder.discount_amount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-end text-xl font-black border-t-2 border-black/80 pt-4 mt-2 text-black">
                <span className="text-base uppercase tracking-wider text-black">Grand Total</span>
                <span>{formatCurrency(printingOrder.total)}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
            <p className="font-serif italic text-lg text-black mb-1">Thank you for shopping with JD Store!</p>
            <p>For support or queries, contact us via WhatsApp.</p>
            <p className="mt-4 text-xs text-gray-400">Admin generated on {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}
    </>
  );
}
