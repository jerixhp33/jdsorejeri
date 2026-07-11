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
      <div className="w-full max-w-[21cm] mb-6 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <a href={`/dashboard/orders`} className="text-gray-500 hover:text-black flex items-center gap-2 font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Orders
        </a>
        <PrintButton label="Download PDF" isPdf={true} filename={`JDStore_Invoice_${order.order_number}.pdf`} targetId="invoice-content" />
      </div>

      {/* Printable Area - STRICTLY A4 FORMAT */}
      <div id="invoice-content" className="w-full max-w-[21cm] bg-white p-12 shadow-xl print:shadow-none print:m-0 border border-gray-100 relative">
        
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-black"></div>

        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8 mt-2">
          <div>
            <h1 className="text-5xl font-serif font-black text-black tracking-tighter uppercase mb-4">Invoice</h1>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-800">Order #{order.order_number}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(order.created_at)}</p>
              {order.payments?.[0]?.transaction_id && (
                <p className="text-sm text-gray-500">Txn: {order.payments[0].transaction_id}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-serif font-black tracking-tighter uppercase mb-2">JD Store</div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>No 6, Sathivel Nagar</p>
              <p>Thiruverkadu, Chennai-77</p>
              <p className="mt-2 font-medium text-gray-800">GSTIN: 27AABCU9603R1ZX</p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-200 pb-2">Billed To</h3>
            <p className="font-bold text-lg text-gray-900 mb-1">{order.delivery_address?.full_name}</p>
            <p className="text-sm text-gray-700 font-medium">Ph: {order.delivery_address?.phone}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-200 pb-2">Shipped To</h3>
            <p className="font-bold text-gray-900 mb-1">{order.delivery_address?.full_name}</p>
            <p className="text-sm text-gray-700">{order.delivery_address?.house_no}, {order.delivery_address?.street}</p>
            {order.delivery_address?.area && <p className="text-sm text-gray-700">{order.delivery_address?.area}</p>}
            <p className="text-sm text-gray-700">{order.delivery_address?.city}, {order.delivery_address?.district} {order.delivery_address?.pincode}</p>
          </div>
        </div>

        {/* Order Items */}
        <table className="w-full mb-10 text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-gray-500 w-16">Image</th>
              <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-gray-500">Item Description</th>
              <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Qty</th>
              <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Unit Price</th>
              <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items?.map((item: any, index: number) => {
              const productName = item.product?.name || item.product_name || 'Unknown Product';
              const primaryImage = item.product?.images?.find((img: any) => img.is_primary)?.url 
                                || item.product?.images?.[0]?.url;
              return (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-2">
                    {primaryImage ? (
                      <img src={primaryImage} alt={productName} className="w-14 h-14 object-cover rounded shadow-sm border border-gray-200" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center shadow-sm">
                        <span className="text-gray-400 text-[10px] uppercase font-medium">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-2">
                    <div className="font-bold text-gray-900 text-base">{productName}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1.5 uppercase tracking-wider flex items-center gap-2">
                      {item.selected_size && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">Size: {item.selected_size}</span>}
                      {item.poster_frame && <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">Frame: {item.poster_frame}</span>}
                    </div>
                  </td>
                  <td className="py-5 px-2 text-center align-middle font-semibold text-gray-900">{item.quantity}</td>
                  <td className="py-5 px-2 text-right align-middle font-medium text-gray-600">₹{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-5 px-2 text-right align-middle font-bold text-gray-900">₹{(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-16">
          <div className="w-full sm:w-1/2 lg:w-2/5 bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between py-2 border-b border-gray-200/60">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-900">₹{subTotalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200/60">
              <span className="text-gray-600 font-medium">Shipping</span>
              <span className="font-semibold text-gray-900">
                {shippingAmount === 0 ? 'Free' : `₹${shippingAmount.toFixed(2)}`}
              </span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200/60">
                <span className="text-gray-600 font-medium">Tax</span>
                <span className="font-semibold text-gray-900">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200/60 text-green-600">
                <span className="font-medium">Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-4 mt-2">
              <span className="font-black text-xl text-gray-900 uppercase tracking-tight">Grand Total</span>
              <span className="font-black text-2xl text-black">₹{grandTotalValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12 border-t border-gray-200 pt-8">
          <p className="font-bold text-black mb-1 uppercase tracking-wider text-xs">Thank you for your business!</p>
          <p className="text-[11px]">This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    </div>
  );
}
