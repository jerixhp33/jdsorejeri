import { Suspense } from 'react';
import { BannersSection, SidebarBannersPanel, MobileSidebarBanners } from '@/components/landing/BannersSection';
import { FeaturedPosters } from '@/components/landing/FeaturedPosters';
import { FeaturedEarrings } from '@/components/landing/FeaturedEarrings';
import { BestSellers } from '@/components/landing/BestSellers';
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

  const [featuredPosters, featuredEarrings, bestSellers, collections, testimonials, faqs, banners, marqueeLabels] = await Promise.all([
    getFeaturedProducts(20).then((products) => products.filter((p) => p.product_type === 'poster')),
    getFeaturedProducts(20).then((products) => products.filter((p) => p.product_type === 'earring')),
    supabase.from('products').select('*, images:product_images(*), category:product_categories(*)').eq('is_active', true).eq('is_best_seller', true).order('created_at', { ascending: false }).limit(4).then(({ data }) => data || []),
    supabase.from('collections').select('*').eq('is_active', true).order('display_order').limit(4).then(({ data }) => data || []),
    supabase.from('testimonials').select('*').eq('is_active', true).order('display_order').limit(8).then(({ data }) => data || []),
    supabase.from('faqs').select('*').eq('is_active', true).order('display_order').limit(10).then(({ data }) => data || []),
    supabase.from('banners').select('*').eq('is_active', true).order('display_order').then(({ data }) => data || []),
    supabase.from('marquee_labels').select('*').eq('is_active', true).order('order_index').then(({ data }) => data || []),
  ]);

  const heroBanners    = banners.filter((b: any) => b.position === 'hero');
  const topBanners     = banners.filter((b: any) => b.position === 'top');
  const middleBanners  = banners.filter((b: any) => b.position === 'middle');
  const bottomBanners  = banners.filter((b: any) => b.position === 'bottom');
  const sidebarBanners = banners.filter((b: any) => b.position === 'sidebar');

  return (
    <>
      {/* Hero-position banners */}
      <div className="pt-32 sm:pt-40 pb-4">
        <BannersSection banners={heroBanners} />
      </div>

      {/* Top banners */}
      <div className="mb-8 lg:mb-12">
        <BannersSection banners={topBanners} />
      </div>

      {/* Best Sellers Section */}
      <div className="mb-8 lg:mb-12">
        <Suspense fallback={<div className="py-20"><ProductGridSkeleton count={8} /></div>}>
          <BestSellers products={bestSellers} />
        </Suspense>
      </div>

      {/* Sidebar layout — desktop only */}
      <div className={sidebarBanners.length > 0 ? 'lg:flex lg:gap-6 px-4 md:px-8 lg:px-12 max-w-[1400px] mx-auto mb-8 lg:mb-12' : 'mb-8 lg:mb-12'}>
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 lg:mb-12">
            <Suspense fallback={<div className="py-20"><ProductGridSkeleton count={8} /></div>}>
              <FeaturedPosters products={featuredPosters} />
            </Suspense>
          </div>

          <div className="mb-8 lg:mb-12">
            <BannersSection banners={middleBanners} />
          </div>

          <div className="mb-8 lg:mb-12">
            <Suspense fallback={<div className="py-20"><ProductGridSkeleton count={8} /></div>}>
              <FeaturedEarrings products={featuredEarrings} />
            </Suspense>
          </div>

          {/* Mobile sidebar banners appear here, right after featured earrings */}
          {sidebarBanners.length > 0 && (
            <div className="lg:hidden mt-8 mb-8">
              <MobileSidebarBanners banners={sidebarBanners} />
            </div>
          )}
        </div>

        {/* Desktop sticky sidebar */}
        {sidebarBanners.length > 0 && (
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <SidebarBannersPanel banners={sidebarBanners} />
          </aside>
        )}
      </div>

      <div className="mb-8 lg:mb-12">
        <CollectionsSection collections={collections} />
      </div>

      <div className="mb-8 lg:mb-12">
        <WhyChooseUs />
      </div>
      
      <div className="mb-8 lg:mb-12">
        <TestimonialsSection testimonials={testimonials} />
      </div>

      <div className="mb-8 lg:mb-12">
        <BannersSection banners={bottomBanners} />
      </div>

      <div className="mb-8 lg:mb-12">
        <FAQSection faqs={faqs} />
      </div>

      <ContactSection />
    </>
  );
}