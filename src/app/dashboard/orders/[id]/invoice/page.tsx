import React from 'react';
import { notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/components/admin/PrintButton';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerInvoicePage({ params }: PageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Check if current user is admin
  const admin = await requireAdmin();
  const isAdmin = !!admin;

  const { data: order, error } = await adminClient.from('orders')
    .select(`
      *,
      items:order_items(*, product:products(name, images:product_images(url, is_primary))),
      delivery_address:delivery_addresses(*),
      payments(*),
      shipments(*)
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    console.error("Customer Invoice Error for ID", id, ":", error);
    return notFound();
  }

  // Security check: Only allow the order owner or an admin to view
  if (order.user_id !== user.id && !isAdmin) {
    return notFound();
  }

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
        <a href={`/dashboard/orders`} className="text-gray-500 hover:text-black flex items-center gap-2 font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Orders
        </a>
        <PrintButton label="Download PDF" isPdf={true} filename={`JDStore_Invoice_${order.order_number}.pdf`} targetId="invoice-content" />
      </div>

      {/* Wrapper for horizontal scroll on mobile */}
      <div className="w-full overflow-x-auto pb-8 flex justify-center print:block print:overflow-visible print:pb-0">
        {/* Printable Area - EXACT PIXEL PERFECT FORMAT FOR A SINGLE PAGE PDF */}
        <div id="invoice-content" className="w-[800px] min-w-[800px] flex-shrink-0 bg-white pt-16 pb-12 px-12 shadow-2xl print:shadow-none print:m-0 relative overflow-hidden">
        
        {/* Invoice Header Centered */}
        <div className="text-center pb-8 border-b-2 border-gray-100 mb-8">
          <h1 className="text-4xl font-serif font-black text-black tracking-tighter uppercase mb-2">JD Store</h1>
          <p className="text-sm text-gray-500 mb-4">
            No 6, Sathivel Nagar, Thiruverkadu, Chennai-77<br/>
            GSTIN: 27AABCU9603R1ZX
          </p>
          <div className="inline-block px-6 py-2 bg-gray-50 border border-gray-200 rounded-lg">
             <span className="font-bold text-gray-900 tracking-widest uppercase text-xs">Tax Invoice</span>
          </div>
        </div>

        {/* Order Info & Payment */}
        <div className="flex justify-between items-start mb-8 text-sm">
          <div>
            <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Order No.</span>
            <span className="font-bold text-lg text-black">#{order.order_number}</span>
          </div>
          <div className="text-right">
            <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Date</span>
            <span className="font-semibold text-gray-900 block mb-3">{formatDate(order.created_at)}</span>
            
            <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Payment Method</span>
            <span className="font-semibold text-gray-900 uppercase block">{order.payments?.[0]?.payment_method || 'UPI'}</span>
            
            {order.payments?.[0]?.transaction_id && (
              <>
                <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 mt-3">Transaction ID</span>
                <span className="font-semibold text-gray-900 font-mono text-xs block">{order.payments[0].transaction_id}</span>
              </>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="flex gap-8 mb-10">
          <div className="flex-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">Billed To</h3>
            <p className="font-bold text-gray-900 mb-1">{order.delivery_address?.full_name}</p>
            <p className="text-sm text-gray-600">Ph: {order.delivery_address?.phone}</p>
          </div>
          <div className="flex-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">Shipped To</h3>
            <p className="font-bold text-gray-900 mb-1">{order.delivery_address?.full_name}</p>
            <p className="text-sm text-gray-600 leading-snug">
              {order.delivery_address?.house_no}, {order.delivery_address?.street}<br/>
              {order.delivery_address?.area && <>{order.delivery_address?.area}<br/></>}
              {order.delivery_address?.city}, {order.delivery_address?.district} {order.delivery_address?.pincode}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <table className="w-full mb-10 text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-16">Image</th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center w-20">Qty</th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right w-24">Price</th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items?.map((item: any, index: number) => {
              const productName = item.product?.name || item.product_name || 'Unknown Product';
              const primaryImage = item.product?.images?.find((img: any) => img.is_primary)?.url 
                                || item.product?.images?.[0]?.url;
              return (
                <tr key={index}>
                  <td className="py-4 px-2">
                    {primaryImage ? (
                      <img src={primaryImage} alt={productName} className="w-12 h-12 object-cover rounded shadow-sm border border-gray-200" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-300 text-[8px] uppercase">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-2">
                    <div className="font-bold text-gray-900 text-sm mb-1">{productName}</div>
                    <div className="flex gap-2">
                      {item.selected_size && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium">Size: {item.selected_size}</span>}
                      {item.poster_frame && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium">Frame: {item.poster_frame}</span>}
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

        {/* Totals Section */}
        <div className="flex justify-end mb-16">
          <div className="w-full sm:w-1/2 lg:w-2/5">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">₹{subTotalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="font-semibold text-gray-900">
                {shippingAmount === 0 ? 'Free' : `₹${shippingAmount.toFixed(2)}`}
              </span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-semibold text-gray-900">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between py-2 text-sm text-green-600">
                <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-4 mt-2 border-t-2 border-black">
              <span className="font-black text-lg text-gray-900 uppercase tracking-tight">Grand Total</span>
              <span className="font-black text-xl text-black">₹{grandTotalValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 mt-auto border-t border-gray-100 pt-8">
          <p className="font-bold text-gray-900 mb-1 uppercase tracking-widest text-[10px]">Thank you for shopping with JD Store</p>
          <p className="text-[9px]">This is a computer-generated document and does not require a signature.</p>
        </div>
      </div>
      </div>
    </div>
  );
}
