'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Search, ChevronDown, ChevronUp, RotateCcw, Download } from 'lucide-react';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { Order } from '@/types';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';

import {
  OrderStatusBadge,
  OrderTimeline,
  PriceSummary,
  OrderItemRow,
  AddressCard,
  TrackingProgress
} from '@/components/shared/orders';

interface OrdersListProps {
  orders: Order[];
}

export function OrdersList({ orders }: OrdersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addItem } = useCart();
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const handleBuyAgain = async (item: any) => {
    setAddingItem(item.id);
    await addItem(
      item.product_id,
      item.unit_price ?? item.price_at_time, // Fallback for old records
      1,
      item.poster_size_id
    );
    setAddingItem(null);
    setAddedItem(item.id);
    setTimeout(() => setAddedItem(null), 2000);
  };



  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      order.order_number.toLowerCase().includes(query) ||
      order.items?.some((item: any) => item.product?.name?.toLowerCase().includes(query));
      
    if (filterStatus === 'active') {
      return ['pending', 'confirmed', 'processing', 'packed', 'label_generated', 'shipped', 'out_for_delivery'].includes(order.status) && matchesSearch;
    }
    if (filterStatus === 'past') {
      return ['delivered', 'cancelled', 'return_requested', 'returned', 'refund_requested', 'refunded'].includes(order.status) && matchesSearch;
    }
    return matchesSearch;
  });

  if (orders.length === 0) {
    return (
      <div className="glass-card p-8 sm:p-16 text-center">
        <motion.div 
          animate={{ y: [0, -10, 0] }} 
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
        </motion.div>
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
          className="glass-card overflow-hidden flex flex-col"
        >
          {/* Progress Bar Header */}
          <TrackingProgress status={order.status} className="px-5 pt-5 mb-2" />

          {/* Order Header */}
          <div
            className="p-4 sm:px-5 pb-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors gap-2"
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

            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <OrderStatusBadge status={order.status} />
              <p className="text-white font-semibold text-sm hidden sm:block">
                {formatCurrency(order.grand_total || order.total || 0)}
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
            <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-8">
                {/* Items */}
                <div>
                  <h3 className="text-white/80 font-medium mb-4 text-sm tracking-wide uppercase">Items Ordered</h3>
                  <div className="space-y-2 divide-y divide-zinc-800/50 border border-zinc-800/50 rounded-xl p-2 bg-zinc-900/30">
                    {order.items?.map((item) => (
                      <div key={item.id} className="relative group">
                        <OrderItemRow item={item} className="px-2" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBuyAgain(item); }}
                            disabled={addingItem === item.id || addedItem === item.id}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                          >
                            {addedItem === item.id ? 'Added' : <><RotateCcw className="w-3 h-3"/> Buy Again</>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline and Tracking */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white/80 font-medium mb-4 text-sm tracking-wide uppercase">Order Tracking</h3>
                    <div className="p-5 border border-zinc-800/50 rounded-xl bg-zinc-900/30">
                      <OrderTimeline 
                        currentStatus={order.status}
                        createdAt={order.created_at}
                        updatedAt={(order as any).updated_at ?? order.created_at}
                      />
                    </div>
                  </div>

                  {order.shipments && order.shipments.length > 0 && (
                    <div>
                      <h3 className="text-white/80 font-medium mb-4 text-sm tracking-wide uppercase">Shipment Details</h3>
                      <div className="p-5 border border-zinc-800/50 rounded-xl bg-zinc-900/30 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Courier:</span>
                          <span className="text-white font-medium uppercase tracking-wider">{order.shipments[0].provider}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-white/40">Tracking (AWB):</span>
                          <span className="font-mono text-white tracking-widest">{order.shipments[0].tracking_number}</span>
                        </div>
                        {order.shipments[0].tracking_url && (
                          <a 
                            href={order.shipments[0].tracking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-4 w-full flex items-center justify-center bg-luxe-accent text-black font-semibold py-2 rounded-lg text-sm hover:bg-white transition-colors"
                          >
                            Track Package
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-white/80 font-medium mb-4 text-sm tracking-wide uppercase">Payment Summary</h3>
                  <div className="p-5 border border-zinc-800/50 rounded-xl bg-zinc-900/30">
                    <PriceSummary order={order} />
                    <Link
                      href={`/dashboard/orders/${order.id}/invoice`}
                      prefetch={true}
                      className="mt-6 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      View & Download Invoice
                    </Link>
                  </div>
                </div>

                {order.delivery_address && (
                  <div>
                    <h3 className="text-white/80 font-medium mb-4 text-sm tracking-wide uppercase">Delivery Details</h3>
                    <AddressCard address={order.delivery_address} />
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
