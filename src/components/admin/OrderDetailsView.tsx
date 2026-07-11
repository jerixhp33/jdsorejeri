'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, FileText, User, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order, OrderStatus } from '@/types';

import {
  OrderStatusBadge,
  PaymentStatusBadge,
  OrderTimeline,
  PriceSummary,
  OrderItemRow,
  AddressCard,
  ShippingCard,
} from '@/components/shared/orders';

export function OrderDetailsView({ initialOrder }: { initialOrder: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState(order.admin_internal_notes || order.admin_notes || '');

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
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveAdminNotes = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Fallback to legacy admin_notes column for now if the new one doesn't exist
        body: JSON.stringify({ id: order.id, admin_notes: adminNotes, updated_at: new Date().toISOString() }),
      });
      if (res.ok) {
        toast.success('Notes saved successfully');
      } else {
        toast.error('Failed to save notes');
      }
    } catch (err) {
      toast.error('Failed to save notes');
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
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status || 'pending'} />
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
            <button onClick={() => updateStatus('processing')} disabled={isUpdating} className="btn-primary">
              Mark Processing
            </button>
          )}
          {order.status === 'processing' && (
            <button onClick={() => updateStatus('packed')} disabled={isUpdating} className="btn-primary">
              Mark Packed
            </button>
          )}
          {order.status === 'packed' && (
            <button onClick={() => updateStatus('label_generated')} disabled={isUpdating} className="btn-primary">
              Generate Label
            </button>
          )}
          {order.status === 'label_generated' && (
            <button onClick={() => updateStatus('shipped')} disabled={isUpdating} className="btn-primary">
              Ship Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Data) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Products Panel */}
          <div className="glass-card overflow-hidden print-hide-glass">
            <div className="p-4 border-b border-zinc-800 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Products ({order.items?.length || 0})
              </h2>
            </div>
            <div className="p-4 space-y-2 divide-y divide-zinc-800/50">
              {order.items?.map((item: any, idx: number) => (
                <OrderItemRow key={idx} item={item} />
              ))}
            </div>
            
            {/* Totals */}
            <div className="p-6 border-t border-zinc-800 bg-white/[0.01] flex justify-end">
              <div className="w-64">
                <PriceSummary order={order} />
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
                        <PaymentStatusBadge status={p.status} />
                      </div>
                      <p className="text-white/50 text-xs">Txn: {p.transaction_id || 'N/A'}</p>
                      <p className="text-white/50 text-xs mt-1">Amount: {p.amount}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/50 text-sm">
                  <p>Method: Online Payment</p>
                  <p className="mt-2"><PaymentStatusBadge status={order.payment_status || 'pending'} /></p>
                </div>
              )}
            </div>

            <div className="glass-card p-6 border border-white/10">
              {order.shipments && order.shipments.length > 0 ? (
                <div className="space-y-4">
                  {order.shipments.map((s, i) => (
                    <ShippingCard key={i} shipment={s as any} />
                  ))}
                </div>
              ) : (
                <div className="text-white/50 text-sm">
                  <h2 className="text-lg font-semibold text-white mb-4">Fulfillment</h2>
                  <p>Status: {order.fulfillment_status}</p>
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
              </div>
              <div className="pt-4 border-t border-white/10">
                {order.delivery_address && (
                   <AddressCard address={order.delivery_address as any} title="Shipping Address" className="border-none bg-transparent p-0" />
                )}
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
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button onClick={saveAdminNotes} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded hover:bg-white/20 transition-all">
                Save Notes
              </button>
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="glass-card p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-6">Order Timeline</h2>
            <OrderTimeline 
              currentStatus={order.status}
              events={order.events}
              createdAt={order.created_at}
              updatedAt={(order as any).updated_at || order.created_at}
            />
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
