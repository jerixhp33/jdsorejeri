export const dynamic = 'force-static';

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ContactSection } from '@/components/landing/ContactSection';
import { FAQSection } from '@/components/landing/FAQSection';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with JD Store via WhatsApp or email.',
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: faqs } = await supabase
    .from('faqs').select('*').eq('is_active', true).order('display_order');

  return (
    <div className="pt-16 sm:pt-20 md:pt-24">
      <ContactSection />
      <FAQSection faqs={faqs || []} />
    </div>
  );
}
