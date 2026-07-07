'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { Order } from '@/types';

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

  if (orders.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-white font-semibold text-lg mb-2">No orders yet</h2>
        <p className="text-white/40 text-sm mb-6">Start shopping and your orders will appear here</p>
        <Link href="/" className="btn-gold text-sm">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-white mb-6">My Orders</h1>

      {orders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card overflow-hidden"
        >
          {/* Order header */}
          <div
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-white/50" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Order #{order.order_number}</p>
                <p className="text-white/40 text-xs">{formatDate(order.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={cn('status-' + order.status)}>{STATUS_LABELS[order.status]}</span>
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
            <div className="border-t border-white/10 p-5 space-y-5">
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
                        <p className="text-white text-sm font-medium">
                          {formatCurrency(item.total_price)}
                        </p>
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

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <div className="text-sm text-white/50">
                  Subtotal {formatCurrency(order.subtotal)} + Delivery{' '}
                  {order.delivery_charge === 0 ? 'FREE' : formatCurrency(order.delivery_charge)}
                </div>
                <p className="text-white font-bold">{formatCurrency(order.total)}</p>
              </div>

              {/* WhatsApp follow-up */}
              {order.status === 'pending' && (
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999'}?text=${encodeURIComponent(`Hi! Following up on my order #${order.order_number}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 text-sm hover:text-green-300 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Follow up via WhatsApp
                </a>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
