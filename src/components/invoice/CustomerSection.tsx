import React from 'react';

interface CustomerSectionProps {
  order: any;
}

export function CustomerSection({ order }: CustomerSectionProps) {
  return (
    <div className="flex gap-8 mb-10">
      <div className="flex-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">
          Bill To
        </h3>
        <p className="font-bold text-gray-900 mb-1">{order.delivery_address?.full_name}</p>
        <p className="text-sm text-gray-600 mb-2">Ph: {order.delivery_address?.phone}</p>
        
        <p className="text-sm text-gray-600 leading-snug">
          {order.delivery_address?.house_no}, {order.delivery_address?.street}<br/>
          {order.delivery_address?.area && <>{order.delivery_address?.area}<br/></>}
          {order.delivery_address?.city}, {order.delivery_address?.district}<br/>
          {order.delivery_address?.state} {order.delivery_address?.pincode}
        </p>
      </div>

      <div className="flex-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">
          Payment Details
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
            <span className="text-gray-500 font-medium">Method:</span>
            <span className="font-bold text-gray-900 uppercase">
              {order.payments?.[0]?.payment_method || 'UPI'}
            </span>
            
            <span className="text-gray-500 font-medium">Status:</span>
            <span className={`font-bold uppercase ${
              order.payment_status?.toLowerCase() === 'paid' ? 'text-green-600' :
              order.payment_status?.toLowerCase() === 'refunded' ? 'text-red-600' :
              'text-orange-500'
            }`}>
              {order.payment_status || 'Pending'}
            </span>
            
            {order.payments?.[0]?.transaction_id && (
              <>
                <span className="text-gray-500 font-medium">Txn ID:</span>
                <span className="font-semibold text-gray-900 font-mono text-xs truncate max-w-[150px]">
                  {order.payments[0].transaction_id}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
