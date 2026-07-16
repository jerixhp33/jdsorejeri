export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | JD Store',
  description: 'Privacy Policy for JD Store.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="page-container py-24 md:py-32 max-w-4xl">
      <Link prefetch={true} href="/" className="inline-flex items-center gap-2 text-foreground/ hover:text-foreground transition-colors mb-8 text-sm">
        <ChevronLeft className="w-4 h-4" />
        Back to Home
      </Link>
      
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Privacy Policy</h1>
      <p className="text-foreground/ mb-12">Last updated: July 10, 2026</p>

      <div className="space-y-8 text-foreground/ leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">1. Information We Collect</h2>
          <p>
            When you use JD Store, we collect information you provide directly to us when you create an account, make a purchase, or contact us for support. This includes your name, email address, phone number, and delivery address. We also collect data through Google OAuth if you choose to sign in using your Google account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-foreground/">
            <li>Process your orders and deliver products to you.</li>
            <li>Send order confirmations and updates via WhatsApp.</li>
            <li>Provide customer support and respond to your inquiries.</li>
            <li>Improve our website, products, and services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">3. Data Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. Your account data is securely stored using Supabase, which implements industry-standard security protocols.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">4. Third-Party Services</h2>
          <p>
            We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf, such as delivery partners and payment processors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via our WhatsApp support number.
          </p>
        </section>
      </div>
    </div>
  );
}
