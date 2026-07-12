import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/components/admin/PrintButton';
import { PremiumInvoiceLayout } from '@/components/invoice/PremiumInvoiceLayout';
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
      <PremiumInvoiceLayout order={order} />
    </div>
  );
}
