import React from 'react';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PremiumInvoiceLayout } from '@/components/invoice/PremiumInvoiceLayout';

// This is a public invoice page accessible without login.
// Security: Order IDs are UUIDs which are effectively unguessable.
// This page is used by the WhatsApp bot's Playwright to generate PDF invoices.

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicInvoicePage({ params }: PageProps) {
  const { id } = await params;
  
  // Use admin client to bypass RLS since there's no logged-in user
  const admin = await createAdminClient();

  const { data: order, error } = await admin.from('orders')
    .select(`
      *,
      items:order_items(*, product:products(name, slug, images:product_images(url, is_primary))),
      delivery_address:delivery_addresses(*),
      payments(*),
      shipments(*)
    `)
    .eq('id', id)
    .single();

  if (error || !order) return notFound();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-10 px-4 font-sans">
      <PremiumInvoiceLayout order={order} />
    </div>
  );
}
