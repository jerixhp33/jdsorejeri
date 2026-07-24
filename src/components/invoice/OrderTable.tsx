import React from 'react';

interface OrderTableProps {
  items: any[];
}

export function OrderTable({ items }: OrderTableProps) {
  return (
    <table className="w-full mb-10 text-left border-collapse">
      <thead>
        <tr className="border-b-2 border-black">
          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-16">Image</th>
          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Item Description</th>
          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center w-20">Qty</th>
          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right w-24">Price</th>
          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right w-28">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items?.map((item: any, index: number) => {
          const productName = item.product?.name || item.product_name || 'Unknown Product';
          const primaryImage = item.product?.images?.find((img: any) => img.is_primary)?.url || item.product?.images?.[0]?.url;
          return (
            <tr key={index}>
              <td className="py-4 px-2">
                {primaryImage ? (
                  <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                    {/* Image is kept in color as requested */}
                    <img 
                      src={primaryImage} 
                      alt={productName} 
                      className="w-full h-full object-cover" 
                      crossOrigin="anonymous" 
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-300 text-[8px] uppercase">No img</span>
                  </div>
                )}
              </td>
              <td className="py-4 px-2">
                <div className="font-bold text-gray-900 text-sm mb-1">{productName}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.selected_size && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Size: {item.selected_size}</span>}
                  {item.selected_color && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Color: {item.selected_color}</span>}
                  {item.selected_material && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Material: {item.selected_material}</span>}
                  {item.poster_size && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Size: {item.poster_size}</span>}
                  {item.poster_frame && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Frame: {item.poster_frame}</span>}
                  {item.poster_finish && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Finish: {item.poster_finish}</span>}
                  {item.variant_name && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium border border-gray-200">Variant: {item.variant_name}</span>}
                </div>
              </td>
              <td className="py-4 px-2 text-center align-middle font-semibold text-gray-900">{item.quantity}</td>
              <td className="py-4 px-2 text-right align-middle font-medium text-gray-600">₹{Number(item.unit_price).toFixed(2)}</td>
              <td className="py-4 px-2 text-right align-middle font-bold text-gray-900">₹{(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
