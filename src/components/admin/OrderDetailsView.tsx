'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, FileText, User, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

import {
  OrderStatusBadge,
  PaymentStatusBadge,
  OrderTimeline,
  PriceSummary,
  OrderItemRow,
  AddressCard,
  ShippingCard,
} from '@/components/shared/orders';
import { ShipmentModal, type ShipmentModalData } from './ShipmentModal';

export function OrderDetailsView({ initialOrder }: { initialOrder: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState(order.admin_internal_notes || order.admin_notes || '');
  
  // Shipment Modal State
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentModalTarget, setShipmentModalTarget] = useState<'shipped' | 'out_for_delivery'>('shipped');



  const updateStatus = async (newStatus: OrderStatus, trackingData?: ShipmentModalData) => {
    setIsUpdating(true);
    try {
      const payload: any = { id: order.id, status: newStatus, updated_at: new Date().toISOString() };
      
      if (trackingData) {
        payload.tracking_data = trackingData;
      }

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { order: updatedOrder } = await res.json();
        if (updatedOrder) {
           setOrder(updatedOrder);
        } else {
           setOrder({ ...order, status: newStatus });
        }
        toast.success(`Order marked as ${newStatus}`);

        // Notify WhatsApp if checked
        if (trackingData?.notify_whatsapp) {
           const phone = order.delivery_address?.phone || '';
           if (phone) {
             const cleanPhone = phone.replace(/\D/g, '');
             const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
             
             let trackUrl = trackingData.tracking_url;
             if (trackingData.provider.toLowerCase().includes('st') && !trackUrl) {
               trackUrl = `https://stcourier.com/track/shipment`;
             }
             
             const text = `Hi ${order.delivery_address?.full_name?.split(' ')[0] || 'Customer'},\n\nYour JD Luxe order #${order.order_number} has been shipped via ${trackingData.provider}.\n\nTracking Number: ${trackingData.tracking_number}\n${trackUrl ? `Track here: ${trackUrl}` : ''}\n\nThank you for shopping with us!`;
             window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
           }
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShipmentModalSubmit = async (data: ShipmentModalData) => {
    await updateStatus(shipmentModalTarget, data);
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
          <Link href="/admin/orders" className="p-2 rounded-xl bg-foreground/ hover:bg-foreground/ text-foreground/ hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">Order #{order.order_number}</h1>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status || 'pending'} />
            </div>
            <p className="text-foreground/ text-sm mt-1">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/admin/orders/${order.id}/invoice`} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </Link>
          <Link href={`/admin/orders/${order.id}/label`} className="btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Print Label</span>
          </Link>
          
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
            <button 
              onClick={() => {
                setShipmentModalTarget('shipped');
                setIsShipmentModalOpen(true);
              }} 
              disabled={isUpdating} 
              className="btn-primary"
            >
              Ship Order
            </button>
          )}
          {order.status === 'shipped' && (
            <button 
              onClick={() => {
                setShipmentModalTarget('out_for_delivery');
                setIsShipmentModalOpen(true);
              }} 
              disabled={isUpdating} 
              className="btn-primary"
            >
              Out for Delivery
            </button>
          )}
          {order.status === 'out_for_delivery' && (
            <button onClick={() => updateStatus('delivered')} disabled={isUpdating} className="btn-primary">
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      <ShipmentModal 
        isOpen={isShipmentModalOpen}
        onClose={() => setIsShipmentModalOpen(false)}
        onSubmit={handleShipmentModalSubmit}
        status={shipmentModalTarget}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Data) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Products Panel */}
          <div className="glass-card overflow-hidden print-hide-glass">
            <div className="p-4 border-b border-zinc-800 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
            <div className="glass-card p-6 border border-foreground/">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-foreground/" />
                Payment Details
              </h2>
              {order.payments && order.payments.length > 0 ? (
                <div className="space-y-4">
                  {order.payments.map((p, i) => (
                    <div key={i} className="bg-foreground/ rounded-lg p-3 border border-foreground/">
                      <div className="flex justify-between mb-2">
                        <span className="text-foreground text-sm font-medium capitalize">{p.provider.replace('_', ' ')}</span>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                      <p className="text-foreground/ text-xs">Txn: {p.transaction_id || 'N/A'}</p>
                      <p className="text-foreground/ text-xs mt-1">Amount: {p.amount}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-foreground/ text-sm">
                  <p className="mb-3">Method: Online Payment</p>
                  <div className="flex items-center gap-3">
                    <select
                      value={order.payment_status || 'pending'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        setIsUpdating(true);
                        try {
                          const res = await fetch('/api/admin/orders', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: order.id, payment_status: newStatus }),
                          });
                          if (res.ok) {
                            setOrder({ ...order, payment_status: newStatus as PaymentStatus });
                            toast.success(`Payment marked as ${newStatus}`);
                          } else {
                            toast.error('Failed to update payment');
                          }
                        } catch (err) {
                          toast.error('Failed to update payment');
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      disabled={isUpdating}
                      className="bg-black/50 border border-foreground/ rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-[#C1A063]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <PaymentStatusBadge status={(order.payment_status as PaymentStatus) || 'pending'} />
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-6 border border-foreground/">
              {order.shipments && order.shipments.length > 0 ? (
                <div className="space-y-4">
                  {order.shipments.map((s, i) => (
                    <ShippingCard key={i} shipment={s as any} />
                  ))}
                </div>
              ) : (
                <div className="text-foreground/ text-sm">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Fulfillment</h2>
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
          <div className="glass-card p-6 border border-foreground/">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-foreground/" />
              Customer
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-foreground font-medium">{(order.delivery_address as any)?.full_name || (order.user as any)?.name}</p>
                <p className="text-foreground/ text-sm mt-1">{(order.user as any)?.email || 'Guest Checkout'}</p>
              </div>
              <div className="pt-4 border-t border-foreground/">
                {order.delivery_address && (
                   <AddressCard address={order.delivery_address as any} title="Shipping Address" className="border-none bg-transparent p-0" />
                )}
              </div>
              {order.delivery_instructions && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-amber-400 text-xs font-semibold uppercase mb-1">Delivery Notes</p>
                  <p className="text-foreground/ text-sm">{order.delivery_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Panel */}
          <div className="glass-card p-6 border border-foreground/">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-foreground/" />
              Admin Notes
            </h2>
            <textarea 
              className="input-luxe w-full h-24 text-sm resize-none"
              placeholder="Add internal notes about this order..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button onClick={saveAdminNotes} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium bg-foreground/ text-foreground rounded hover:bg-foreground/ transition-all">
                Save Notes
              </button>
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="glass-card p-6 border border-foreground/">
            <h2 className="text-lg font-semibold text-foreground mb-6">Order Timeline</h2>
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
