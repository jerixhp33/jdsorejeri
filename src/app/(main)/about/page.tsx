export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Shield, Truck, RefreshCw, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About JD Store',
  description: 'Learn about JD Store — premium wall posters and earrings delivered across Tamil Nadu.',
};

export default function AboutPage() {
  return (
    <div className="page-container py-10 md:py-20">
      {/* Hero */}
      <div className="max-w-3xl mb-20">
        <p className="text-luxe-accent text-sm tracking-widest uppercase mb-4">Our Story</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          We believe in art that moves you
        </h1>
        <p className="text-white/60 text-lg leading-relaxed">
          JD Store was founded with a simple belief: beautiful things shouldn't be a luxury reserved
          for the few. We curate museum-quality wall prints and handcrafted earrings that bring
          art and elegance into everyday Tamil Nadu homes.
        </p>
      </div>

      {/* Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div id="shipping" className="glass-card p-6">
          <Truck className="w-6 h-6 text-luxe-accent mb-4" />
          <h2 className="text-white font-semibold text-lg mb-3">Shipping Policy</h2>
          <div className="space-y-3 text-white/55 text-sm leading-relaxed">
            <p>We deliver to all 38 districts of Tamil Nadu. Orders typically dispatch within 1–2 business days and arrive within 3–5 business days.</p>
            <p>Free delivery is available on orders above ₹999. A flat ₹60 charge applies to smaller orders.</p>
            <p>You'll receive status updates via WhatsApp at each stage of your order.</p>
          </div>
        </div>
        <div id="returns" className="glass-card p-6">
          <RefreshCw className="w-6 h-6 text-luxe-accent mb-4" />
          <h2 className="text-white font-semibold text-lg mb-3">Return Policy</h2>
          <div className="space-y-3 text-white/55 text-sm leading-relaxed">
            <p>We accept returns within 7 days of delivery for damaged, defective, or incorrect items.</p>
            <p>To initiate a return, contact us on WhatsApp with your order number and photos of the issue.</p>
            <p>Refunds are processed within 5–7 business days after we receive the returned item.</p>
          </div>
        </div>
        <div id="privacy" className="glass-card p-6">
          <Shield className="w-6 h-6 text-luxe-accent mb-4" />
          <h2 className="text-white font-semibold text-lg mb-3">Privacy Policy</h2>
          <div className="space-y-3 text-white/55 text-sm leading-relaxed">
            <p>We collect only the information necessary to process your orders and improve your experience. We use Google OAuth for secure authentication.</p>
            <p>Your personal data is never sold to third parties. We use it only to fulfill your orders and send you relevant updates.</p>
            <p>You can request deletion of your account data at any time by contacting us.</p>
          </div>
        </div>
        <div id="terms" className="glass-card p-6">
          <Award className="w-6 h-6 text-luxe-accent mb-4" />
          <h2 className="text-white font-semibold text-lg mb-3">Terms of Service</h2>
          <div className="space-y-3 text-white/55 text-sm leading-relaxed">
            <p>By using JD Store, you agree to our terms. We reserve the right to refuse service and cancel orders at our discretion.</p>
            <p>All products are subject to availability. Prices are listed in Indian Rupees (INR) and include applicable taxes.</p>
            <p>Orders are confirmed only after our team responds via WhatsApp. We are not responsible for delays due to incorrect delivery information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
