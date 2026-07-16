import React from 'react';
import { InvoiceHeader } from './InvoiceHeader';
import { CustomerSection } from './CustomerSection';
import { OrderTable } from './OrderTable';
import { SummarySection } from './SummarySection';
import { ShippingSection } from './ShippingSection';
import { InvoiceFooter } from './InvoiceFooter';

interface PremiumInvoiceLayoutProps {
  order: any;
}

export function PremiumInvoiceLayout({ order }: PremiumInvoiceLayoutProps) {
  return (
    <div className="w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0">
      <div 
        id="invoice-content"
        className="print-receipt-container bg-white min-w-[210mm] max-w-[210mm] mx-auto min-h-[297mm] shadow-[0_0_40px_rgba(0,0,0,0.1)] p-10 sm:p-12 flex flex-col relative font-sans text-black print:shadow-none print:w-[210mm] print:h-[297mm] print:overflow-hidden print:p-8"
      >
        <div className="flex-1 flex flex-col">
          <InvoiceHeader order={order} />
          
          <CustomerSection order={order} />
          
          <OrderTable items={order.items || []} />
          
          <SummarySection order={order} />
          
          <ShippingSection order={order} />
          
          <div className="flex-1" /> {/* Spacer to push footer to bottom */}
          
          <InvoiceFooter />
        </div>
      </div>
    </div>
  );
}
