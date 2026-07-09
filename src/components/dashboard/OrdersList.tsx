'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, MessageCircle, ChevronDown, ChevronUp, Search, RotateCcw, Download } from 'lucide-react';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { Order } from '@/types';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';

interface OrdersListProps {
  orders: Order[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  ready: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrdersList({ orders }: OrdersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addItem } = useCart();
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const handleBuyAgain = async (item: any) => {
    setAddingItem(item.id);
    await addItem(
      item.product_id,
      item.total_price / item.quantity,
      1,
      item.poster_size_id
    );
    setAddingItem(null);
  };

  const handleDownloadInvoice = (order: Order) => {
    const text = `INVOICE - Order #${order.order_number}\nDate: ${formatDate(order.created_at)}\nStatus: ${order.status.toUpperCase()}\n\nItems:\n${order.items?.map(i => `- ${i.product?.name} (Qty: ${i.quantity}) - ${formatCurrency(i.total_price)}`).join('\n')}\n\nSubtotal: ${formatCurrency(order.subtotal)}\nDelivery: ${formatCurrency(order.delivery_charge)}\nTotal: ${formatCurrency(order.total)}\n\nShipping To:\n${order.delivery_address?.full_name}\n${order.delivery_address?.house_no}, ${order.delivery_address?.street}\n${order.delivery_address?.city}, ${order.delivery_address?.district} - ${order.delivery_address?.pincode}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${order.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  };

  const getTimelineSteps = (status: string, courierName?: string, trackingNumber?: string) => {
    return [
      { label: 'Order Placed', desc: 'We have received your order.', active: true },
      { label: 'Confirmed', desc: 'Your order has been verified and confirmed.', active: ['confirmed', 'packed', 'ready', 'delivered'].includes(status) },
      { label: 'Packed', desc: 'Your package has been prepared and boxed.', active: ['packed', 'ready', 'delivered'].includes(status) },
      { label: 'Dispatched', desc: courierName ? `Shipped via ${courierName}` : 'Handed over to courier.', active: ['ready', 'delivered'].includes(status) },
      { label: 'Delivered', desc: 'Package successfully delivered.', active: status === 'delivered' },
    ];
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      order.order_number.toLowerCase().includes(query) ||
      order.items?.some((item: any) => item.product?.name?.toLowerCase().includes(query));
      
    if (filterStatus === 'active') {
      return ['pending', 'confirmed', 'packed', 'ready'].includes(order.status) && matchesSearch;
    }
    if (filterStatus === 'past') {
      return ['delivered', 'cancelled'].includes(order.status) && matchesSearch;
    }
    return matchesSearch;
  });

  if (orders.length === 0) {
    return (
      <div className="glass-card p-8 sm:p-16 text-center">
        <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-white font-semibold text-lg mb-2">No orders yet</h2>
        <p className="text-white/40 text-sm mb-6">Start shopping and your orders will appear here</p>
        <Link prefetch={true} href="/" className="btn-gold text-sm">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-white">My Orders</h1>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID or Product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-luxe-accent transition-colors"
          />
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          {(['all', 'active', 'past'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                filterStatus === status ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-white/50">No orders match your filters.</p>
          <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-3 text-luxe-accent text-sm underline">Clear Filters</button>
        </div>
      ) : filteredOrders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card overflow-hidden"
        >
          {/* Order header */}
          <div
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors gap-2"
            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-white/50" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm">Order #{order.order_number}</p>
                <p className="text-white/40 text-xs">{formatDate(order.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <span className={cn('status-' + order.status, 'text-[10px] sm:text-xs')}>{STATUS_LABELS[order.status]}</span>
              <p className="text-white font-semibold text-sm hidden sm:block">
                {formatCurrency(order.total)}
              </p>
              {expandedId === order.id ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </div>
          </div>

          {/* Expanded details */}
          {expandedId === order.id && (
            <div className="border-t border-white/10 p-4 sm:p-5 space-y-5">
              {/* Items */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-3">
                  {order.items?.map((item) => {
                    const img = (item.product?.images as any[])?.find((i: any) => i.is_primary) ||
                      (item.product?.images as any[])?.[0];
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-luxe-dark flex-shrink-0">
                          {img && (
                            <Image src={img.url} alt={item.product?.name || ''} width={48} height={48} className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{item.product?.name}</p>
                          <p className="text-white/40 text-xs">
                            {(item.poster_size as any)?.label && `${(item.poster_size as any).label} · `}
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-white text-sm font-medium">
                            {formatCurrency(item.total_price)}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBuyAgain(item); }}
                            disabled={addingItem === item.id}
                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-luxe-accent hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {addingItem === item.id ? 'Adding...' : 'Buy Again'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Address */}
              {order.delivery_address && (
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Delivery Address</p>
                  <p className="text-white/70 text-sm">
                    {order.delivery_address.house_no}, {order.delivery_address.street},{' '}
                    {order.delivery_address.area}, {order.delivery_address.city} –{' '}
                    {order.delivery_address.pincode}, {order.delivery_address.district}
                  </p>
                </div>
              )}

              {/* Tracking */}
              {order.status !== 'cancelled' && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">Order Tracking</p>
                      {((order as any).tracking_number) ? (
                        <>
                          <p className="text-white text-sm font-medium">{(order as any).courier_name || 'ST Courier'}</p>
                          <p className="text-white/70 text-xs">AWB: {(order as any).tracking_number}</p>
                        </>
                      ) : (
                        <p className="text-white/70 text-xs">Status: {STATUS_LABELS[order.status]}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedTrackingId(expandedTrackingId === order.id ? null : order.id)}
                      className="text-xs font-semibold bg-luxe-accent text-black px-4 py-2 rounded-xl hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-1"
                    >
                      <span>Track Order</span>
                      {expandedTrackingId === order.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {expandedTrackingId === order.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="glass-card p-5 border border-white/10 space-y-6 overflow-hidden"
                    >
                      <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Live Tracking Timeline</h4>
                      
                      {/* Timeline Steps */}
                      <div className="relative pl-6 space-y-6">
                        {/* Connecting Line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />

                        {getTimelineSteps(order.status, (order as any).courier_name, (order as any).tracking_number).map((step, idx) => (
                          <div key={idx} className="relative flex gap-4">
                            {/* Circle Node */}
                            <div className={cn(
                              "absolute left-[-24px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all duration-300",
                              step.active 
                                ? "bg-luxe-accent border-luxe-accent shadow-[0_0_8px_#d4af37]" 
                                : "bg-luxe-black border-white/20"
                            )} />
                            
                            <div>
                              <p className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                step.active ? "text-luxe-accent" : "text-white/30"
                              )}>
                                {step.label}
                              </p>
                              <p className="text-xs text-white/50 mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Direct Courier Tracking Link */}
                      {((order as any).tracking_number) && (
                        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <span className="text-[10px] text-white/40 font-mono">Carrier: {(order as any).courier_name || 'ST Courier'} AWB#{(order as any).tracking_number}</span>
                          <a
                            href="https://stcourier.com/track/shipment"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              navigator.clipboard.writeText((order as any).tracking_number);
                              toast.success('AWB number copied to clipboard! Paste it on the tracking page.');
                            }}
                            className="text-xs font-semibold border border-luxe-accent text-luxe-accent hover:bg-luxe-accent hover:text-black transition-all px-4 py-2 rounded-xl text-center w-full sm:w-auto"
                          >
                            Go to Official Courier Portal
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <div className="text-sm text-white/50">
                  Subtotal {formatCurrency(order.subtotal)} + Delivery{' '}
                  {order.delivery_charge === 0 ? 'FREE' : formatCurrency(order.delivery_charge)}
                </div>
                <p className="text-white font-bold">{formatCurrency(order.total)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2">
                {order.status === 'pending' && (
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999'}?text=${encodeURIComponent(`Hi! Following up on my order #${order.order_number}`)}`}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-400 text-sm hover:text-green-300 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Follow up via WhatsApp
                  </a>
                )}
                
                {['delivered', 'cancelled'].includes(order.status) && (
                  <button
                    onClick={() => handleDownloadInvoice(order)}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
