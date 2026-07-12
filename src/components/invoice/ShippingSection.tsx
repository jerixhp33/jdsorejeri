import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShippingSectionProps {
  order: any;
}

export function ShippingSection({ order }: ShippingSectionProps) {
  // Only show if order has shipping details and is shipped/delivered
  const isShipped = ['shipped', 'delivered'].includes(order.status?.toLowerCase());
  const shipment = order.shipments?.[0];

  if (!isShipped || !shipment) {
    return null;
  }

  const trackingUrl = shipment.tracking_url || `https://track.jdstore.com/${shipment.tracking_number}`;

  return (
    <div className="mb-10 p-6 border border-gray-200 bg-gray-50 flex items-center justify-between">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-2">
          Shipping Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-gray-500 font-medium">Courier Partner:</span>
            <span className="font-bold text-gray-900">{shipment.carrier || 'Standard Courier'}</span>
            
            <span className="text-gray-500 font-medium">Tracking (AWB):</span>
            <span className="font-bold text-black font-mono">{shipment.tracking_number || 'N/A'}</span>
            
            {shipment.estimated_delivery_date && (
              <>
                <span className="text-gray-500 font-medium">Est. Delivery:</span>
                <span className="font-semibold text-gray-900">{new Date(shipment.estimated_delivery_date).toLocaleDateString('en-IN')}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Tracking QR Code */}
      <div className="flex flex-col items-center">
        <div className="bg-white p-2 rounded shadow-sm border border-gray-200">
          <QRCodeSVG 
            value={trackingUrl} 
            size={72} 
            level="L" 
            includeMargin={false} 
          />
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-2">Scan to Track</span>
      </div>
    </div>
  );
}
