import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-api';
import { PrintButton } from '@/components/admin/PrintButton';
import { LabelBarcode } from '@/components/admin/LabelBarcode';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LabelPage({ params }: PageProps) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return notFound();

  const { data: order, error } = await admin.from('orders')
    .select(`
      *,
      items:order_items(*),
      delivery_address:delivery_addresses(*),
      shipments(*)
    `)
    .eq('id', id)
    .single();

  if (error || !order) return notFound();

  const shipment = order.shipments?.[0];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans print:bg-white print:p-0 print:block print:min-h-0">
      
      {/* Print Controls (Hidden in Print) */}
      <div className="print:hidden absolute top-4 left-4">
        <Link href={`/admin/orders/${order.id}`} className="text-gray-500 hover:text-black flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Order
        </Link>
      </div>
      <div className="print:hidden absolute top-4 right-4">
        <PrintButton label="Download 4x6 PDF" isPdf={true} filename={`Label_${order.order_number}.pdf`} targetId="label-content" />
      </div>

      {/* 4x6 Inch Label Container */}
      <div 
        id="label-content"
        className="bg-white text-black border-2 border-black flex flex-col print:break-inside-avoid print:mx-auto" 
        style={{ width: '4in', minHeight: '4in', boxSizing: 'border-box' }}
      >
        {/* Header - Sender Info */}
        <div className="border-b-2 border-black p-3 text-sm flex justify-between items-start shrink-0">
          <div>
            <div className="font-bold text-lg uppercase tracking-tighter">JD Store</div>
            <div>No 6, Sathivel Nagar</div>
            <div>Thiruverkadu, Chennai-77</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl uppercase tracking-wider">{shipment?.provider || 'STANDARD'}</div>
          </div>
        </div>

        {/* Recipient Info */}
        <div className="p-4">
          <div className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Deliver To:</div>
          <div className="font-bold text-xl mb-2 break-words">
            {order.delivery_address?.full_name}
          </div>
          <div className="text-lg mb-2 break-words">
            {order.delivery_address?.house_no}, {order.delivery_address?.street}
            {order.delivery_address?.area && <span>, {order.delivery_address.area}</span>}
          </div>
          <div className="text-lg font-bold">
            {order.delivery_address?.city}, {order.delivery_address?.district}
          </div>
          <div className="text-2xl font-black tracking-widest mt-1">
            {order.delivery_address?.pincode}
          </div>
          <div className="text-md mt-2 font-semibold">
            Ph: {order.delivery_address?.phone}
          </div>
        </div>

        {/* Order Details Mini */}
        <div className="border-t-2 border-black p-2 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <span className="text-xs font-bold uppercase text-gray-500 block">Order ID</span>
            <span className="font-mono font-bold text-md">{order.order_number}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase text-gray-500 block">Weight</span>
            <span className="font-bold text-md">{shipment?.package_weight || '1.5'} kg</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase text-gray-500 block">Payment</span>
            <span className="font-bold text-md">{order.payment_status === 'paid' ? 'PREPAID' : 'COD'}</span>
          </div>
        </div>

        {/* Barcode Section (Bottom) */}
        <div className="border-t-2 border-black p-4 bg-white flex flex-col items-center justify-center shrink-0">
          <LabelBarcode value={`${order.order_number}-${order.delivery_address?.phone || ''}`} />
          <div className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-widest">Delivery Scan Code</div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
