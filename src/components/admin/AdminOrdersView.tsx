'use client';

import React, { useState } from 'react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<OrderStatus | ''>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [dispatchCourier, setDispatchCourier] = useState('ST Courier');
  const [dispatchCustomCourier, setDispatchCustomCourier] = useState('');
  const [dispatchAwb, setDispatchAwb] = useState('');

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

  const updateStatus = async (orderId: string, newStatus: OrderStatus, trackingInfo?: { courier: string; awb: string }) => {
    setUpdatingId(orderId);
    try {
      const payload: any = { id: orderId, status: newStatus, updated_at: new Date().toISOString() };
      if (trackingInfo?.awb) {
        payload.tracking_number = trackingInfo.awb;
        payload.courier_name = trackingInfo.courier;
      }
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || result?.error) {
        toast.error('Failed to update status');
      } else {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { 
          ...o, 
          status: newStatus,
          tracking_number: trackingInfo?.awb || (o as any).tracking_number,
          courier_name: trackingInfo?.courier || (o as any).courier_name
        } : o));

        // Notify user
        const order = orders.find(o => o.id === orderId);
        if (order?.user_id) {
          const messages: Partial<Record<OrderStatus, string>> = {
            confirmed: 'Your order has been confirmed! 🎉',
            packed: 'Your order is packed and ready for dispatch.',
            ready: 'Your order is out for delivery! 🚚',
            delivered: 'Your order has been delivered. Enjoy! 😊',
          };
          let notifyMsg = messages[newStatus] || '';
          if ((newStatus === 'packed' || newStatus === 'ready') && trackingInfo?.awb) {
            notifyMsg += ` Shipped via ${trackingInfo.courier} (AWB: ${trackingInfo.awb}).`;
          }

          if (notifyMsg) {
            await fetch('/api/admin/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                _notify: true,
                user_id: order.user_id,
                order_number: order.order_number,
                message: notifyMsg,
                // Email notification details
                _send_email: true,
                email: (order.user as any)?.email,
                customer_name: (order.user as any)?.name || 'Valued Customer',
                courier_name: trackingInfo?.courier,
                tracking_number: trackingInfo?.awb,
                status: newStatus,
              }),
            });
          }
        }
        toast.success(`Order status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setUpdatingId(null);
    }
  };

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
        
        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mr-2">
            <select 
              value={bulkActionStatus} 
              onChange={e => setBulkActionStatus(e.target.value as OrderStatus)}
              className="input-luxe py-1.5 text-xs bg-luxe-dark"
            >
              <option value="">Bulk Actions ({selectedIds.size})</option>
              {STATUSES.filter(s => s.value !== 'all').map(s => (
                <option key={s.value} value={s.value}>Mark as {s.label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={isBulkUpdating || !bulkActionStatus}
              className="px-3 py-1.5 text-xs font-semibold bg-luxe-accent text-black rounded-lg hover:bg-luxe-accent/80 transition-all disabled:opacity-50"
            >
              {isBulkUpdating ? 'Updating...' : 'Apply'}
            </button>
          </div>
        )}

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
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-white/5 accent-luxe-accent cursor-pointer"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
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
                  <td colSpan={9} className="px-4 py-16 text-center text-white/30 text-sm">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="rounded border-white/20 bg-white/5 accent-luxe-accent cursor-pointer"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelection(order.id)}
                          />
                          <button 
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="p-1 text-white/40 hover:text-white transition-colors"
                          >
                            <ChevronDown className={cn("w-4 h-4 transition-transform", expandedId === order.id ? "rotate-180" : "")} />
                          </button>
                        </div>
                      </td>
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
                            onClick={() => {
                              const next = NEXT_STATUS[order.status as OrderStatus]!;
                              if (next === 'packed' || next === 'ready') {
                                setDispatchOrder(order);
                                setDispatchCourier('ST Courier');
                                setDispatchCustomCourier('');
                                setDispatchAwb('');
                              } else {
                                updateStatus(order.id, next);
                              }
                            }}
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
                        {/* Send AWB via WhatsApp */}
                        {(order.status === 'packed' || order.status === 'ready') && (order as any).tracking_number && ((order.delivery_address as any)?.phone || (order.user as any)?.phone) && (
                          <a
                            href={`https://wa.me/91${((order.delivery_address as any)?.phone || (order.user as any)?.phone)}?text=${encodeURIComponent(
                              `Hi ${(order.delivery_address as any)?.full_name || (order.user as any)?.name || 'Customer'}, your JD Store order #${order.order_number} has been shipped via ${(order as any).courier_name || 'ST Courier'} (AWB: ${(order as any).tracking_number}). Track here: https://stcourier.com/track/shipment`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                            title="Send Tracking Info via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Send AWB</span>
                          </a>
                        )}
                        {/* WhatsApp contact */}
                        {((order.delivery_address as any)?.phone || (order.user as any)?.phone) && (
                          <a
                            href={`https://wa.me/91${((order.delivery_address as any)?.phone || (order.user as any)?.phone)}?text=${encodeURIComponent(`Hi! Regarding your order #${order.order_number}`)}`}
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
                  {expandedId === order.id && (
                    <tr className="bg-white/[0.01]">
                      <td colSpan={9} className="px-6 py-4 border-b border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3">Order Items</h4>
                            <div className="space-y-3">
                              {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-lg border border-white/10">
                                  <div className="w-12 h-12 bg-luxe-dark rounded-md overflow-hidden flex-shrink-0">
                                    {item.product?.images?.[0]?.url && (
                                      <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{item.product?.name || 'Unknown'}</p>
                                    <p className="text-white/40 text-xs">
                                      {item.poster_size?.label ? `Size: ${item.poster_size.label}` : 'Standard'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-white/70 text-xs">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                    <p className="text-luxe-accent text-sm font-bold mt-0.5">{formatCurrency(item.total_price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3">Delivery Details</h4>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-1.5">
                              <p className="text-white font-medium">{(order.delivery_address as any)?.full_name || (order.user as any)?.name}</p>
                              <p className="text-white/70 text-sm">{(order.delivery_address as any)?.phone}</p>
                              <div className="text-white/50 text-sm mt-3 pt-3 border-t border-white/10">
                                <p>{[(order.delivery_address as any)?.house_no, (order.delivery_address as any)?.street, (order.delivery_address as any)?.area].filter(Boolean).join(', ')}</p>
                                <p>{[(order.delivery_address as any)?.city, (order.delivery_address as any)?.district].filter(Boolean).join(', ')} - {(order.delivery_address as any)?.pincode}</p>
                                <p>{(order.delivery_address as any)?.state}, {(order.delivery_address as any)?.country}</p>
                              </div>
                            </div>
                            
                            {(order.discount_amount || 0) > 0 && (
                              <div className="mt-4 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 flex justify-between items-center">
                                <span className="text-emerald-400 text-sm font-medium">Discount Applied</span>
                                <span className="text-emerald-400 font-bold">-{formatCurrency(order.discount_amount || 0)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
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

      {/* Dispatch Details Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border border-white/15 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Dispatch Details</h3>
              <p className="text-white/50 text-xs font-sans">Enter courier tracking information for Order #{dispatchOrder.order_number}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Courier Partner</label>
                <select
                  value={dispatchCourier}
                  onChange={(e) => setDispatchCourier(e.target.value)}
                  className="input-luxe w-full"
                >
                  <option value="ST Courier">ST Courier</option>
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              {dispatchCourier === 'Other' && (
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Custom Courier Name</label>
                  <input
                    type="text"
                    value={dispatchCustomCourier}
                    onChange={(e) => setDispatchCustomCourier(e.target.value)}
                    placeholder="Enter courier name"
                    className="input-luxe w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Tracking Number (AWB)</label>
                <input
                  type="text"
                  value={dispatchAwb}
                  onChange={(e) => setDispatchAwb(e.target.value)}
                  placeholder="Enter tracking number"
                  className="input-luxe w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-xs hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const courier = dispatchCourier === 'Other' ? dispatchCustomCourier : dispatchCourier;
                  if (!courier.trim()) {
                    toast.error('Please enter a courier name');
                    return;
                  }
                  if (!dispatchAwb.trim()) {
                    toast.error('Please enter a tracking number');
                    return;
                  }
                  const next = NEXT_STATUS[dispatchOrder.status as OrderStatus]!;
                  updateStatus(dispatchOrder.id, next, { courier, awb: dispatchAwb });
                  setDispatchOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-luxe-accent text-black font-semibold text-xs hover:bg-white transition-all"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
