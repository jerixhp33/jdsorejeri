'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CustomerAnalyticsService } from '@/lib/customer-analytics';
import { 
  User, Mail, Phone, Calendar, Star, TrendingUp, AlertTriangle, FileText, 
  Package, Truck, MapPin, Heart, Clock, Activity, Save, CheckCircle
} from 'lucide-react';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function CustomerProfileView({ customer }: { customer: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [adminNotes, setAdminNotes] = useState(customer.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const analytics = useMemo(() => CustomerAnalyticsService.calculate(customer.orders), [customer.orders]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const supabase = createClient();
    await supabase.from('customers').update({ admin_notes: adminNotes }).eq('id', customer.id);
    setIsSavingNotes(false);
  };

  // Build Chronological Timeline
  const timeline = useMemo(() => {
    const events: any[] = [];
    
    events.push({
      date: new Date(customer.created_at),
      title: 'Account Created',
      icon: User,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    });

    customer.orders?.forEach((order: any) => {
      events.push({
        date: new Date(order.created_at),
        title: `Order Placed (#${order.id.slice(0,8)})`,
        description: `${order.order_items?.length || 0} items • ${formatCurrency(order.grand_total)}`,
        icon: Package,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10'
      });

      order.shipments?.forEach((shipment: any) => {
        if (shipment.status === 'delivered') {
          events.push({
             date: new Date(shipment.updated_at),
             title: `Order Delivered`,
             description: `AWB: ${shipment.tracking_number}`,
             icon: CheckCircle,
             color: 'text-emerald-400',
             bg: 'bg-emerald-500/10'
          });
        }
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [customer]);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notes', label: 'Admin Notes', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-luxe-accent">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-luxe-accent/10 border-2 border-luxe-accent flex items-center justify-center">
            <span className="text-3xl font-bold text-luxe-accent">
              {customer.user_profile?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              {customer.user_profile?.name || 'Unknown User'}
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border",
                analytics.segment === 'VIP' ? "bg-luxe-accent/10 text-luxe-accent border-luxe-accent/20" :
                analytics.segment === 'New' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                analytics.segment === 'At Risk' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {analytics.segment}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {customer.user_profile?.email}</span>
              {customer.user_profile?.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {customer.user_profile?.phone}</span>}
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {formatDate(customer.created_at)}</span>
            </div>
            <p className="text-white/40 text-xs mt-2 font-mono">Customer ID: {customer.customer_number}</p>
          </div>
        </div>

        {/* Loyalty Quick Stats */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-black/40 border border-white/5 min-w-[250px]">
          <div>
            <Star className={cn("w-8 h-8", 
              customer.membership_tier === 'gold' ? "text-amber-400" :
              customer.membership_tier === 'silver' ? "text-slate-300" :
              customer.membership_tier === 'platinum' ? "text-indigo-300" :
              "text-amber-700"
            )} />
          </div>
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Membership Tier</p>
            <p className="text-white font-bold capitalize text-lg">{customer.membership_tier}</p>
            <p className="text-luxe-accent text-xs font-medium mt-1">{customer.loyalty_points} Points Available</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                activeTab === tab.id 
                  ? "bg-luxe-accent/15 text-luxe-accent border border-luxe-accent/20" 
                  : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Analytics Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-5 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-luxe-accent mb-3" />
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Lifetime Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.lifetimeValue)}</p>
                </div>
                <div className="glass-card p-5 rounded-xl">
                  <Package className="w-5 h-5 text-blue-400 mb-3" />
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalOrders}</p>
                </div>
                <div className="glass-card p-5 rounded-xl">
                  <Activity className="w-5 h-5 text-purple-400 mb-3" />
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.averageOrderValue)}</p>
                </div>
                <div className="glass-card p-5 rounded-xl bg-red-500/5 border-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-400 mb-3" />
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Return Rate</p>
                  <p className="text-2xl font-bold text-red-400">{analytics.returnRate.toFixed(1)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm">Favorite Category</span>
                      <span className="text-white font-medium capitalize">{analytics.favoriteCategory || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm">Preferred Payment</span>
                      <span className="text-white font-medium capitalize">{analytics.favoritePaymentMethod || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-6">
                   <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Notes</h3>
                   {customer.admin_notes ? (
                     <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{customer.admin_notes}</p>
                   ) : (
                     <p className="text-white/30 text-sm italic">No admin notes added for this customer.</p>
                   )}
                   <button onClick={() => setActiveTab('notes')} className="text-luxe-accent text-xs hover:underline mt-4">Edit Notes</button>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="glass-card p-6 md:p-8">
              <h2 className="text-lg font-bold text-white mb-8">Customer Journey</h2>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10">
                {timeline.map((event, i) => (
                  <div key={i} className="relative flex items-start gap-6">
                    <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 shadow-xl", event.bg)}>
                      <event.icon className={cn("w-4 h-4", event.color)} />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                        <h4 className="text-base font-semibold text-white">{event.title}</h4>
                        <span className="text-white/40 text-xs">{formatDate(event.date)}</span>
                      </div>
                      {event.description && <p className="text-sm text-white/60">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADMIN NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-luxe-accent" />
                Private Admin Notes
              </h2>
              <p className="text-white/50 text-sm mb-6">These notes are strictly for internal staff and are never visible to the customer.</p>
              
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input-luxe w-full h-64 resize-y p-4 text-sm leading-relaxed"
                placeholder="e.g. VIP Customer. Prefers phone calls before delivery. Gift buyer."
              />
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          )}

          {/* Fallback for other tabs like Orders and Addresses (can be expanded later) */}
          {['orders', 'addresses'].includes(activeTab) && (
            <div className="glass-card p-12 text-center">
              <p className="text-white/50 text-sm">Detailed views for {activeTab} are actively tracking from the Orders module.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
