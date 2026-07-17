'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '@/lib/utils';
import { JDLogo } from '@/components/shared/JDLogo';

interface InvoiceHeaderProps {
  order: any;
}

export function InvoiceHeader({ order }: InvoiceHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'packed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="mb-8">
      {/* Centered Logo & Title */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-3">
          <JDLogo size={48} className="text-black" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-black tracking-tighter uppercase mb-1">
          JD Store
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          Order Invoice
        </p>
      </div>

      {/* Invoice Meta Data & Barcode */}
      <div className="flex justify-between items-end border-b-2 border-black/10 pb-6">
        <div className="space-y-3">
          <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
            <span className="text-gray-500 font-medium">Invoice No:</span>
            <span className="font-bold text-black">INV-{order.order_number}</span>
            
            <span className="text-gray-500 font-medium">Order ID:</span>
            <span className="font-bold text-black">#{order.order_number}</span>
            
            <span className="text-gray-500 font-medium">Invoice Date:</span>
            <span className="font-bold text-black">{formatDate(order.created_at)}</span>
            
            <span className="text-gray-500 font-medium">Order Status:</span>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code (print optimized) */}
        <div className="bg-white p-2 rounded border border-gray-100 shadow-sm print:shadow-none print:border-none print:p-0 text-right">
          <QRCodeSVG 
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/orders/${order.id}/invoice`} 
            size={48} 
            level="L"
            className="ml-auto"
          />
          <p className="text-[9px] text-gray-400 font-mono mt-1 text-center tracking-widest">{order.order_number}</p>
        </div>
      </div>
    </div>
  );
}
