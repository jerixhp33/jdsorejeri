'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Truck, FileText, User, CreditCard, Clock, CheckCircle, Package } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order, OrderStatus, PaymentStatus, FulfillmentStatus } from '@/types';

export function OrderDetailsView({ initialOrder }: { initialOrder: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus, updated_at: new Date().toISOString() }),
      });
      if (res.ok) {
        setOrder({ ...order, status: newStatus });
        toast.success(`Order marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-white">Order #{order.order_number}</h1>
              <span className={cn('status-' + order.status, 'text-xs')}>{order.status}</span>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider",
                (order.payment_status || 'pending') === 'paid' ? "bg-emerald-500/10 text-emerald-400" :
                (order.payment_status || 'pending') === 'pending' ? "bg-amber-500/10 text-amber-400" :
                "bg-red-500/10 text-red-400"
              )}>
                {order.payment_status || 'Pending'}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-1">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          
          {order.status === 'pending' && (
            <button onClick={() => updateStatus('confirmed')} disabled={isUpdating} className="btn-primary">
              Confirm Order
            </button>
          )}
          {order.status === 'confirmed' && (
            <button onClick={() => updateStatus('packed')} disabled={isUpdating} className="btn-primary">
              Mark as Packed
            </button>
          )}
          {order.status === 'packed' && (
            <button onClick={() => updateStatus('shipped')} disabled={isUpdating} className="btn-primary flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Ship Order</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Data) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Products Panel */}
          <div className="glass-card overflow-hidden print-hide-glass">
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-luxe-accent" />
                Products ({order.items?.length || 0})
              </h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Item</th>
                    <th className="px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium text-center">Qty</th>
                    <th className="px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium text-right">Price</th>
                    <th className="px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-luxe-dark border border-white/10 overflow-hidden flex-shrink-0">
                            {item.product?.images?.[0]?.url && (
                              <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{item.product?.name || 'Unknown Item'}</p>
                            {item.poster_size?.label && (
                              <p className="text-sm text-white/50 mt-1">Variant: {item.poster_size.label}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-white">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-white/70">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-white">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="p-4 bg-white/[0.01] flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Shipping</span>
                    <span>{order.shipping_cost || order.delivery_charge === 0 ? 'FREE' : formatCurrency(order.shipping_cost || order.delivery_charge)}</span>
                  </div>
                  {(order.tax || 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Tax</span>
                      <span>{formatCurrency(order.tax || 0)}</span>
                    </div>
                  )}
                  {(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400 font-medium">
                      <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                      <span>-{formatCurrency(order.discount_amount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/10 mt-3">
                    <span>Grand Total</span>
                    <span>{formatCurrency(order.grand_total || order.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment & Courier Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <div className="glass-card p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-white/50" />
                Payment Details
              </h2>
              {order.payments && order.payments.length > 0 ? (
                <div className="space-y-4">
                  {order.payments.map((p, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-white text-sm font-medium capitalize">{p.provider.replace('_', ' ')}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                          p.status === 'paid' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        )}>{p.status}</span>
                      </div>
                      <p className="text-white/50 text-xs">Txn: {p.transaction_id || 'N/A'}</p>
                      <p className="text-white/50 text-xs mt-1">Amount: {formatCurrency(p.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/50 text-sm">
                  <p>Method: Online Payment</p>
                  <p className="mt-1">Status: {order.payment_status}</p>
                </div>
              )}
            </div>

            <div className="glass-card p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-white/50" />
                Shipping Details
              </h2>
              {order.shipments && order.shipments.length > 0 ? (
                <div className="space-y-4">
                  {order.shipments.map((s, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-white text-sm font-medium capitalize">{s.provider.replace('_', ' ')}</span>
                        <span className="text-luxe-accent text-xs font-semibold">{s.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-white/50 text-xs">AWB: {s.tracking_number || 'Pending'}</p>
                      {s.tracking_url && (
                        <a href={s.tracking_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline mt-1 inline-block">Track Package</a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/50 text-sm">
                  <p>Fulfillment: {order.fulfillment_status}</p>
                  <p className="mt-1 text-xs">No active shipments yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Customer & Timeline) */}
        <div className="space-y-6 print:hidden">
          
          {/* Customer Panel */}
          <div className="glass-card p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-white/50" />
              Customer
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-white font-medium">{(order.delivery_address as any)?.full_name || (order.user as any)?.name}</p>
                <p className="text-white/50 text-sm mt-1">{(order.user as any)?.email || 'Guest Checkout'}</p>
                <p className="text-white/50 text-sm">{(order.delivery_address as any)?.phone || (order.user as any)?.phone}</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Shipping Address</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {[(order.delivery_address as any)?.house_no, (order.delivery_address as any)?.street, (order.delivery_address as any)?.area].filter(Boolean).join(', ')}<br />
                  {[(order.delivery_address as any)?.city, (order.delivery_address as any)?.district].filter(Boolean).join(', ')} - {(order.delivery_address as any)?.pincode}<br />
                  {(order.delivery_address as any)?.state}, {(order.delivery_address as any)?.country || 'India'}
                </p>
              </div>
              {order.delivery_instructions && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-amber-400 text-xs font-semibold uppercase mb-1">Delivery Notes</p>
                  <p className="text-white/80 text-sm">{order.delivery_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Panel */}
          <div className="glass-card p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-white/50" />
              Admin Notes
            </h2>
            <textarea 
              className="input-luxe w-full h-24 text-sm resize-none"
              placeholder="Add internal notes about this order..."
              defaultValue={order.admin_internal_notes || order.admin_notes || ''}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded hover:bg-white/20 transition-all">
                Save Notes
              </button>
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="glass-card p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-white/50" />
              Order Timeline
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:ml-[11px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {order.events && order.events.length > 0 ? (
                order.events.map((event, i) => (
                  <div key={event.id} className="relative flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-luxe-dark border-2 border-luxe-accent flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-luxe-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                        {event.description && <p className="text-xs text-white/50 mt-1">{event.description}</p>}
                        <p className="text-[10px] text-white/30 uppercase mt-1">{event.actor_type}</p>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs text-white/50 block">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-white/30">{new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative flex items-start gap-4">
                   <div className="relative z-10 w-6 h-6 rounded-full bg-luxe-dark border-2 border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-white/50" />
                   </div>
                   <div>
                     <h4 className="text-sm font-semibold text-white">Order Created</h4>
                     <p className="text-[10px] text-white/30 uppercase mt-1">System</p>
                   </div>
                   <div className="text-right whitespace-nowrap ml-auto">
                      <span className="text-xs text-white/50 block">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-white/30">{new Date(order.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Print View Fallback Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; color: black; }
          .print\\:hidden { display: none !important; }
          .glass-card { border: none !important; box-shadow: none !important; background: transparent !important; }
          .print-hide-glass { border-bottom: 2px solid black !important; padding: 0 !important; }
          * { color: black !important; border-color: #ddd !important; }
        }
      `}} />
    </div>
  );
}
