import React from 'react';

interface SummarySectionProps {
  order: any;
}

export function SummarySection({ order }: SummarySectionProps) {
  const itemsTotal = (order.items || []).reduce((sum: number, item: any) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
  const discountAmount = Number(order.discount_amount || 0);
  const taxAmount = Number(order.tax || 0);
  const shippingAmount = Number(order.shipping_fee ?? order.shipping_cost ?? order.delivery_charge ?? 0);
  
  const subTotalValue = Number(order.subtotal) > 0 ? Number(order.subtotal) : (Number(order.total) > 0 ? Number(order.total) : itemsTotal);
  const grandTotalValue = Number(order.grand_total) > 0 
    ? Number(order.grand_total) 
    : (subTotalValue + shippingAmount + taxAmount - discountAmount);

  return (
    <div className="flex justify-end mb-16">
      <div className="w-full sm:w-1/2 lg:w-2/5 pl-8 border-l border-gray-100">
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500 font-medium">Subtotal</span>
          <span className="font-semibold text-gray-900">₹{subTotalValue.toFixed(2)}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between py-2 text-sm text-black">
            <span className="font-medium">Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
            <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500 font-medium">Delivery Charge</span>
          <span className="font-semibold text-gray-900">
            {shippingAmount === 0 ? 'Free' : `₹${shippingAmount.toFixed(2)}`}
          </span>
        </div>
        
        {taxAmount > 0 && (
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-500 font-medium">Tax</span>
            <span className="font-semibold text-gray-900">₹{taxAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-4 mt-2 border-t-2 border-black">
          <span className="font-black text-lg text-black uppercase tracking-widest">Grand Total</span>
          <span className="font-black text-2xl text-black">₹{grandTotalValue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
