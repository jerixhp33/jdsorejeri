import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/components/admin/PrintButton';
import Link from 'next/link';

// Define a type for the page props that is compatible with Next.js 15
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: PageProps) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return notFound();

  const { data: order, error } = await admin.from('orders')
    .select(`
      *,
      items:order_items(*, product:products(name, images:product_images(url, is_primary))),
      delivery_address:delivery_addresses(*),
      payments(*),
      shipments(*)
    `)
    .eq('id', id)
    .single();

  if (error || !order) return notFound();

  const itemsTotal = (order.items || []).reduce((sum: number, item: any) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
  const discountAmount = Number(order.discount_amount || 0);
  const taxAmount = Number(order.tax || 0);
  const shippingAmount = Number(order.shipping_cost ?? order.delivery_charge ?? 0);
  
  // Calculate final totals with fallbacks
  const subTotalValue = Number(order.total) > 0 ? Number(order.total) : itemsTotal;
  const grandTotalValue = Number(order.grand_total) > 0 
    ? Number(order.grand_total) 
    : (subTotalValue + shippingAmount + taxAmount - discountAmount);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans print:bg-white print:p-0">
      
      {/* Controls Container (Always OUTSIDE the PDF target) */}
      <div className="w-full max-w-3xl mb-6 print:hidden flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Link href={`/admin/orders/${order.id}`} className="text-gray-500 hover:text-black flex items-center gap-2 font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Order
        </Link>
        <PrintButton label="Download PDF" isPdf={true} filename={`JDStore_Invoice_${order.order_number}.pdf`} targetId="invoice-content" />
      </div>

      {/* Printable Area */}
      <div id="invoice-content" className="print-receipt-container w-full max-w-2xl bg-white text-black p-8 sm:p-12 min-h-screen print:p-0 print:min-h-0 mx-auto shadow-sm">
        
        <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
          <h1 className="text-4xl font-serif font-bold text-black tracking-tight mb-2">JD Store</h1>
          <p className="text-gray-500 font-medium tracking-wide uppercase text-xs tracking-widest">Official Order Receipt</p>
        </div>
        
        <div className="flex justify-between mb-10">
          <div>
            <h3 className="font-bold text-lg mb-2 text-black uppercase tracking-wider text-xs">Billed To</h3>
            <p className="font-semibold text-lg text-black">{order.delivery_address?.full_name}</p>
            <p className="text-gray-700">{order.delivery_address?.phone}</p>
            <p className="max-w-xs text-gray-700 mt-1">
              {order.delivery_address?.house_no}, {order.delivery_address?.street}
              {order.delivery_address?.area ? `, ${order.delivery_address?.area}` : ''}, {order.delivery_address?.city}
            </p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg mb-2 text-black uppercase tracking-wider text-xs">Order Info</h3>
            <p className="text-gray-700">Order ID: <strong className="text-black">#{order.order_number}</strong></p>
            <p className="text-gray-700">Date: <span className="font-medium text-black">{formatDate(order.created_at)}</span></p>
            <p className="text-gray-700">Status: <span className="text-amber-600 font-semibold uppercase">{order.status}</span></p>
          </div>
        </div>

        <table className="w-full text-left mb-10 border-collapse">
          <thead>
            <tr className="border-b-2 border-black/80">
              <th className="py-3 text-black uppercase text-xs tracking-wider font-bold w-[50%]">Item Description</th>
              <th className="py-3 text-center text-black uppercase text-xs tracking-wider font-bold">Qty</th>
              <th className="py-3 text-right text-black uppercase text-xs tracking-wider font-bold">Price</th>
              <th className="py-3 text-right text-black uppercase text-xs tracking-wider font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, idx: number) => {
              const productName = item.product?.name || item.product_name || 'Unknown Product';
              const primaryImage = item.product?.images?.find((img: any) => img.is_primary)?.url || item.product?.images?.[0]?.url;
              return (
                <tr key={idx} className="border-b border-gray-200/60">
                  <td className="py-5 pr-4">
                    <div className="flex items-center gap-4">
                      {primaryImage && (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                          <img src={primaryImage} alt={productName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-base text-black leading-snug">{productName}</p>
                        {item.selected_size && <p className="text-sm text-gray-500 mt-0.5">Size: {item.selected_size}</p>}
                        {item.poster_frame && <p className="text-sm text-gray-500 mt-0.5">Frame: {item.poster_frame}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 text-center text-black font-medium">{item.quantity}</td>
                  <td className="py-5 text-right text-gray-700">₹{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-5 text-right font-bold text-black">₹{(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex justify-end mb-16">
          <div className="w-72 space-y-3 bg-gray-50/50 p-6 rounded-xl border border-gray-100 print:border-none print:p-0">
            <div className="flex justify-between items-center text-gray-600 text-sm">
              <span>Subtotal</span>
              <span className="font-medium text-black">₹{subTotalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 text-sm">
              <span>Delivery</span>
              <span className="font-medium text-black">{shippingAmount === 0 ? 'FREE' : `₹${shippingAmount.toFixed(2)}`}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-600 text-sm font-medium">
                <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-gray-600 text-sm">
                <span>Tax</span>
                <span className="font-medium text-black">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end text-xl font-black border-t-2 border-black/80 pt-4 mt-2 text-black">
              <span className="text-base uppercase tracking-wider text-black">Grand Total</span>
              <span>₹{grandTotalValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
          <p className="font-serif italic text-lg text-black mb-1">Thank you for shopping with JD Store!</p>
          <p>For support or queries, contact us via WhatsApp.</p>
          <p className="mt-4 text-xs text-gray-400">Generated on {new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}
