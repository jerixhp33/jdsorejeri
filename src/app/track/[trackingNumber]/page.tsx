import { notFound } from 'next/navigation';
import { shippingService } from '@/lib/shipping/providers';
import { createAdminClient } from '@/lib/supabase/server';
import { Truck, CheckCircle, Clock, MapPin, Package, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { JDLogo } from '@/components/shared/JDLogo';

export default async function PublicTrackingPage({ params }: { params: Promise<{ trackingNumber: string }> }) {
  const { trackingNumber } = await params;
  if (!trackingNumber) return notFound();

  // Try to find the shipment in our DB to get the right provider
  const supabase = await createAdminClient();
  const { data: shipment } = await supabase
    .from('shipments')
    .select('provider, order:orders(order_number)')
    .eq('tracking_number', trackingNumber)
    .single();

  const providerId = shipment?.provider || 'st_courier'; // fallback
  const tracking = await shippingService.track(trackingNumber, providerId);

  if (!tracking || !tracking.success) {
    return (
      <div className="min-h-screen bg-luxe-black flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Tracking Not Found</h1>
          <p className="text-white/50 text-sm">We couldn't find any tracking information for AWB <strong>{trackingNumber}</strong>. Please verify the number and try again.</p>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  let progress = 0;
  if (tracking.currentStatus === 'delivered') progress = 100;
  else if (tracking.currentStatus === 'out_for_delivery') progress = 80;
  else if (tracking.currentStatus === 'in_transit') progress = 50;
  else if (tracking.currentStatus === 'picked_up') progress = 25;
  else progress = 10;

  return (
    <div className="min-h-screen bg-luxe-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <JDLogo size={28} />
            <span className="text-white font-bold text-lg hidden sm:block">JD Store Tracking</span>
          </div>
          {shipment?.order && (
            <div className="text-right">
              <p className="text-white/50 text-xs">Order</p>
              <p className="text-white font-medium text-sm">#{(Array.isArray(shipment.order) ? shipment.order[0] : shipment.order)?.order_number}</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass-card overflow-hidden">
          {/* Status Header */}
          <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Current Status</p>
                <h1 className="text-3xl font-bold text-white capitalize flex items-center gap-3">
                  {tracking.currentStatus.replace(/_/g, ' ')}
                  {tracking.currentStatus === 'delivered' && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                </h1>
                <p className="text-white/60 text-sm mt-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-white/40" />
                  AWB: <span className="text-white font-medium">{trackingNumber}</span>
                  <span className="text-white/30 px-2">•</span>
                  <span className="capitalize">{providerId.replace('_', ' ')}</span>
                </p>
              </div>
              
              {tracking.estimatedDelivery && tracking.currentStatus !== 'delivered' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:text-right">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Estimated Delivery</p>
                  <p className="text-xl font-medium text-luxe-accent">{new Date(tracking.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    tracking.currentStatus === 'delivered' ? "bg-emerald-400" : "bg-luxe-accent"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] text-white/40 uppercase font-medium">Shipped</span>
                <span className="text-[10px] text-white/40 uppercase font-medium">In Transit</span>
                <span className="text-[10px] text-white/40 uppercase font-medium">Out for Delivery</span>
                <span className="text-[10px] text-white/40 uppercase font-medium">Delivered</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-6">Tracking History</h3>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10">
              {tracking.events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event, i) => (
                <div key={i} className="relative flex items-start gap-5">
                  <div className={cn(
                    "relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-luxe-dark mt-0.5",
                    i === 0 ? "border-luxe-accent" : "border-white/20"
                  )}>
                    {i === 0 && <span className="w-2 h-2 rounded-full bg-luxe-accent" />}
                  </div>
                  
                  <div className="flex-1 pb-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                      <h4 className={cn("text-base font-semibold", i === 0 ? "text-white" : "text-white/80")}>{event.status}</h4>
                      <div className="text-left sm:text-right">
                        <span className="text-white/60 text-sm block sm:inline">{formatDate(event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp)}</span>
                      </div>
                    </div>
                    {event.description && <p className="text-sm text-white/60 mt-1">{event.description}</p>}
                    {event.location && (
                      <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs">Powered by JD Store Fulfillment Engine</p>
        </div>
      </main>
    </div>
  );
}
