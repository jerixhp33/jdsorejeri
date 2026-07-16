import { Truck, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Shipment {
  provider: string;
  tracking_number: string;
  tracking_url?: string;
  status: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface Props {
  shipment: Shipment;
  className?: string;
}

export function ShippingCard({ shipment, className = '' }: Props) {
  if (!shipment) return null;

  return (
    <div className={`p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4 ${className}`}>
      <h3 className="text-foreground font-medium flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-sky-400" />
          Shipping Details
        </span>
        <span className="text-xs px-2 py-1 bg-zinc-800 rounded-full text-zinc-300 capitalize">
          {shipment.status.replace('_', ' ')}
        </span>
      </h3>
      
      <div className="space-y-3 text-sm text-zinc-400">
        <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
          <span className="text-zinc-500">Provider</span>
          <span className="text-zinc-200 font-medium">{shipment.provider}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
          <span className="text-zinc-500">Tracking Number</span>
          <div className="flex items-center gap-2 text-zinc-200 font-medium">
            {shipment.tracking_number}
            {shipment.tracking_url && (
              <a 
                href={shipment.tracking_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 transition-colors"
                title="Track package"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {shipment.estimated_delivery && (
          <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <Calendar className="w-3.5 h-3.5" />
              Estimated Delivery
            </span>
            <span className="text-zinc-200">
              {format(new Date(shipment.estimated_delivery), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {shipment.shipped_at && (
          <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
            <span className="text-zinc-500">Shipped On</span>
            <span className="text-zinc-200">
              {format(new Date(shipment.shipped_at), 'MMM d, h:mm a')}
            </span>
          </div>
        )}
        
        {shipment.delivered_at && (
          <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
            <span className="text-zinc-500">Delivered On</span>
            <span className="text-zinc-200 text-green-400">
              {format(new Date(shipment.delivered_at), 'MMM d, h:mm a')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
