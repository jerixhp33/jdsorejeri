import { Suspense } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { BannersSection, SidebarBannersPanel, MobileSidebarBanners } from '@/components/landing/BannersSection';
import { FeaturedPosters } from '@/components/landing/FeaturedPosters';
import { FeaturedEarrings } from '@/components/landing/FeaturedEarrings';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { CollectionsSection } from '@/components/landing/CollectionsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { getFeaturedProducts } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const [featuredPosters, featuredEarrings, collections, testimonials, faqs, banners] = await Promise.all([
    getFeaturedProducts(8).then((products) => products.filter((p) => p.product_type === 'poster')),
    getFeaturedProducts(8).then((products) => products.filter((p) => p.product_type === 'earring')),
    supabase.from('collections').select('*').eq('is_active', true).order('display_order').limit(4).then(({ data }) => data || []),
    supabase.from('testimonials').select('*').eq('is_active', true).order('display_order').limit(8).then(({ data }) => data || []),
    supabase.from('faqs').select('*').eq('is_active', true).order('display_order').limit(10).then(({ data }) => data || []),
    supabase.from('banners').select('*').eq('is_active', true).order('display_order').then(({ data }) => data || []),
  ]);

  const heroBanners    = banners.filter((b: any) => b.position === 'hero');
  const topBanners     = banners.filter((b: any) => b.position === 'top');
  const middleBanners  = banners.filter((b: any) => b.position === 'middle');
  const bottomBanners  = banners.filter((b: any) => b.position === 'bottom');
  const sidebarBanners = banners.filter((b: any) => b.position === 'sidebar');

  return (
    <>
      <HeroSection />

      {/* Hero-position banners */}
      <BannersSection banners={heroBanners} />

      {/* Top banners */}
      <BannersSection banners={topBanners} />

      {/*
        Mobile: sidebar banners appear here as a horizontal scroll strip,
        right after the top banners — NOT buried below all products.
        Desktop: they appear in the sticky aside column.
      */}
      {sidebarBanners.length > 0 && (
        <div className="lg:hidden">
          <MobileSidebarBanners banners={sidebarBanners} />
        </div>
      )}

      {/* Sidebar layout — desktop only */}
      <div className={sidebarBanners.length > 0 ? 'lg:flex lg:gap-6 px-4 md:px-8 lg:px-12 max-w-[1400px] mx-auto' : ''}>
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<div className="py-20"><ProductGridSkeleton count={8} /></div>}>
            <FeaturedPosters products={featuredPosters} />
          </Suspense>

          <BannersSection banners={middleBanners} />

          <Suspense fallback={<div className="py-20"><ProductGridSkeleton count={8} /></div>}>
            <FeaturedEarrings products={featuredEarrings} />
          </Suspense>
        </div>

        {/* Desktop sticky sidebar */}
        {sidebarBanners.length > 0 && (
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <SidebarBannersPanel banners={sidebarBanners} />
          </aside>
        )}
      </div>

      <WhyChooseUs />
      <CollectionsSection collections={collections} />
      <TestimonialsSection testimonials={testimonials} />

      <BannersSection banners={bottomBanners} />

      <FAQSection faqs={faqs} />
      <ContactSection />
    </>
  );
}