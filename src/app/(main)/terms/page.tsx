export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | JD Store',
  description: 'Terms of Service for JD Store.',
};

export default function TermsOfServicePage() {
  return (
    <div className="page-container py-24 md:py-32 max-w-4xl">
      <Link prefetch={true} href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm">
        <ChevronLeft className="w-4 h-4" />
        Back to Home
      </Link>
      
      <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
      <p className="text-white/50 mb-12">Last updated: July 10, 2026</p>

      <div className="space-y-8 text-white/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using JD Store, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. Orders and Payment</h2>
          <p>
            All orders placed through our platform are subject to availability and acceptance. Payment is securely processed via UPI transfers confirmed through WhatsApp. We reserve the right to refuse or cancel any order for any reason at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. Shipping and Delivery</h2>
          <p>
            We currently deliver exclusively within Tamil Nadu. Delivery times may vary depending on the destination and courier availability. We are not liable for any delays caused by the shipping carrier.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. Returns and Refunds</h2>
          <p>
            Returns and refunds are handled on a case-by-case basis. Please contact our support team via WhatsApp with any issues regarding your received items within 48 hours of delivery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">5. Modifications to Service</h2>
          <p>
            JD Store reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
          </p>
        </section>
      </div>
    </div>
  );
}
