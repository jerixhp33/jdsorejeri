'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Package, Truck, AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShipmentModal, type ShipmentModalData } from './ShipmentModal';
import type { Shipment, OrderStatus } from '@/types';

type ShipmentStatus = Shipment['status'] | 'all';

const STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: 'all', label: 'All Shipments' },
  { value: 'pending', label: 'Ready to Ship (Pending)' },
  { value: 'label_generated', label: 'Label Generated' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed_attempt', label: 'Failed Delivery' },
  { value: 'returned_to_sender', label: 'Returned' },
];

export function ShippingDashboardView({ initialShipments, pendingOrders = [] }: { initialShipments: any[], pendingOrders?: any[] }) {
  const [shipments, setShipments] = useState(() => {
    const existingOrderIds = new Set(initialShipments.map(s => s.order_id));
    const synthesized = pendingOrders
      .filter(order => !existingOrderIds.has(order.id))
      .map(order => ({
        id: `pending-${order.id}`,
        order_id: order.id,
        provider: 'Pending Assignment',
        tracking_number: 'Not assigned',
        status: order.status === 'shipped' ? 'label_generated' : 'pending',
        created_at: order.created_at,
        updated_at: order.created_at,
        order: order
      }));
    return [...synthesized, ...initialShipments];
  });
  const [filter, setFilter] = useState<ShipmentStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  const handleUpdateTracking = async (data: ShipmentModalData) => {
    if (!targetOrderId) return;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetOrderId,
          status: 'shipped',
          tracking_data: data
        }),
      });

      if (!res.ok) throw new Error('Failed to update order');
      
      toast.success('Tracking details assigned and order shipped!');
      setIsModalOpen(false);

      // WhatsApp logic
      if (data.notify_whatsapp) {
        const targetShipment = shipments.find(s => s.order_id === targetOrderId);
        const phone = targetShipment?.order?.delivery_address?.phone;
        const customerName = targetShipment?.order?.delivery_address?.full_name?.split(' ')[0] || 'Customer';
        const orderNumber = targetShipment?.order?.order_number;
        
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '');
          const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
          
          let trackUrl = data.tracking_url;
          // Force ST Courier link if ST Courier is chosen and tracking_url is empty
          if (data.provider.toLowerCase().includes('st') && !trackUrl) {
            trackUrl = `https://stcourier.com/track/shipment`;
          }
          
          const text = `Hi ${customerName},\n\nYour JD Luxe order #${orderNumber} has been shipped via ${data.provider}.\n\nTracking Number: ${data.tracking_number}\n${trackUrl ? `Track here: ${trackUrl}` : ''}\n\nThank you for shopping with us!`;
          window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
        }
      }
      
      // Update local UI immediately
      setShipments(prev => prev.map(s => 
        s.order_id === targetOrderId 
          ? { 
              ...s, 
              status: 'in_transit', 
              provider: data.provider, 
              tracking_number: data.tracking_number,
              tracking_url: data.tracking_url 
            } 
          : s
      ));
    } catch (err) {
      toast.error('Failed to assign tracking details');
      console.error(err);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let readyToShip = 0;
    let awaitingPickup = 0;
    let pickedUpToday = 0;
    let inTransit = 0;
    let deliveredToday = 0;
    let issues = 0;

    shipments.forEach(s => {
      const created = new Date(s.created_at);
      created.setHours(0, 0, 0, 0);
      const updated = new Date(s.updated_at);
      updated.setHours(0, 0, 0, 0);

      if (s.status === 'pending') readyToShip++;
      if (s.status === 'label_generated') awaitingPickup++;
      if (s.status === 'picked_up' && updated.getTime() === today.getTime()) pickedUpToday++;
      if (s.status === 'in_transit') inTransit++;
      if (s.status === 'delivered' && updated.getTime() === today.getTime()) deliveredToday++;
      if (s.status === 'failed_attempt' || s.status === 'returned_to_sender') issues++;
    });

    return { readyToShip, awaitingPickup, pickedUpToday, inTransit, deliveredToday, issues };
  }, [shipments]);

  const filtered = shipments.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch = !search ||
      s.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.order?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.order?.delivery_address?.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const generateBulkManifest = () => {
    alert('This will trigger the ManifestGenerator to create a consolidated PDF for selected shipments.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Fulfillment Dashboard</h1>
          <p className="text-foreground/ text-sm mt-1">Manage shipments, couriers, and tracking</p>
        </div>
        <div className="flex gap-3">
          <button onClick={generateBulkManifest} disabled={selectedIds.size === 0} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Generate Manifest</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-xl border border-foreground/">
          <p className="text-foreground/ text-[10px] uppercase tracking-wider mb-1">Ready to Ship</p>
          <p className="text-2xl font-bold text-amber-400">{kpis.readyToShip}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-foreground/">
          <p className="text-foreground/ text-[10px] uppercase tracking-wider mb-1">Awaiting Pickup</p>
          <p className="text-2xl font-bold text-blue-400">{kpis.awaitingPickup}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-foreground/">
          <p className="text-foreground/ text-[10px] uppercase tracking-wider mb-1">Picked Up Today</p>
          <p className="text-2xl font-bold text-purple-400">{kpis.pickedUpToday}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-foreground/">
          <p className="text-foreground/ text-[10px] uppercase tracking-wider mb-1">In Transit</p>
          <p className="text-2xl font-bold text-indigo-400">{kpis.inTransit}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-foreground/">
          <p className="text-foreground/ text-[10px] uppercase tracking-wider mb-1">Delivered Today</p>
          <p className="text-2xl font-bold text-emerald-400">{kpis.deliveredToday}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-red-400/70 text-[10px] uppercase tracking-wider mb-1">Failed / Returns</p>
          <p className="text-2xl font-bold text-red-400">{kpis.issues}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/" />
            <input
              type="text"
              placeholder="Search AWB, Order ID, Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-luxe pl-9 text-sm w-full"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as ShipmentStatus)}
            className="input-luxe text-sm py-2 px-3 bg-card border-foreground/"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
             <span className="text-luxe-accent text-sm font-medium">{selectedIds.size} Selected</span>
             <button className="px-3 py-1.5 text-xs font-semibold bg-foreground/ text-foreground rounded hover:bg-foreground/ transition-all">Bulk Print Labels</button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/ bg-white/[0.02]">
                <th className="px-4 py-4 text-left w-12">
                  <input type="checkbox" className="rounded border-foreground/ bg-foreground/ accent-luxe-accent cursor-pointer" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-4 py-4 text-left text-foreground/ text-xs uppercase tracking-wider font-semibold">Shipment / AWB</th>
                <th className="px-4 py-4 text-left text-foreground/ text-xs uppercase tracking-wider font-semibold">Order</th>
                <th className="px-4 py-4 text-left text-foreground/ text-xs uppercase tracking-wider font-semibold">Courier</th>
                <th className="px-4 py-4 text-left text-foreground/ text-xs uppercase tracking-wider font-semibold">Destination</th>
                <th className="px-4 py-4 text-left text-foreground/ text-xs uppercase tracking-wider font-semibold">Status</th>
                <th className="px-4 py-4 text-right text-foreground/ text-xs uppercase tracking-wider font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-foreground/ text-sm">No shipments match your criteria.</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded border-foreground/ bg-foreground/ accent-luxe-accent cursor-pointer" checked={selectedIds.has(s.id)} onChange={() => toggleSelection(s.id)} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-foreground font-medium">{s.tracking_number || 'Pending Assignment'}</p>
                      <p className="text-foreground/ text-xs mt-0.5">{formatDate(s.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/orders/${s.order_id}`} className="text-luxe-accent hover:underline text-sm font-medium">#{s.order?.order_number}</Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded bg-foreground/ text-foreground/ text-xs font-medium capitalize border border-foreground/">{s.provider?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-foreground text-sm font-medium">{s.order?.delivery_address?.city || s.order?.delivery_address?.district || 'Unknown'}</p>
                      <p className="text-foreground/ text-xs mt-0.5">{s.order?.delivery_address?.state || ''}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider",
                        ['pending', 'label_generated'].includes(s.status) ? "bg-blue-500/10 text-blue-400" :
                        s.status === 'delivered' ? "bg-emerald-500/10 text-emerald-400" :
                        ['failed_attempt', 'returned_to_sender'].includes(s.status) ? "bg-red-500/10 text-red-400" :
                        "bg-purple-500/10 text-purple-400"
                      )}>
                        {s.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {s.label_url ? (
                        <a href={s.label_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground/ text-foreground/ text-xs font-medium hover:bg-foreground/ hover:text-foreground transition-all">
                          Print Label
                        </a>
                      ) : (
                        <button 
                          onClick={() => {
                            setTargetOrderId(s.order_id);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-luxe-accent text-black text-xs font-bold hover:bg-white hover:text-black transition-all"
                        >
                          Assign Tracking
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShipmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateTracking}
        status="shipped"
      />
    </div>
  );
}
