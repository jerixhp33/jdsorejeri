import { Suspense } from 'react';
import { BannersSection, SidebarBannersPanel, MobileSidebarBanners } from '@/components/landing/BannersSection';
import { DynamicShowcase } from '@/components/landing/DynamicShowcase';
import { BestSellers } from '@/components/landing/BestSellers';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { CollectionsSection } from '@/components/landing/CollectionsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { getFeaturedProducts } from '@/lib/products';
import { createPublicClient } from '@/lib/supabase/server';
import { JDStoreAmbientBackground } from '@/components/ui/JDStoreAmbientBackground';

import { getActiveFlashSale } from '@/lib/flash-sales';
import { FlashSaleTimerClient } from '@/components/layout/FlashSaleTimerClient';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createPublicClient();
  
  // Fetch ONLY fast, layout-blocking data here to ensure rapid First Contentful Paint
  const [banners, collections, marqueeLabels, flashSale] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).order('display_order').then(({ data }) => data || []),
    supabase.from('collections').select('*').eq('is_active', true).order('display_order').limit(4).then(({ data }) => data || []),
    supabase.from('marquee_labels').select('*').eq('is_active', true).order('order_index').then(({ data }) => data || []),
    getActiveFlashSale(),
  ]);

  const heroBanners    = banners.filter((b: any) => b.position === 'hero');
  const topBanners     = banners.filter((b: any) => b.position === 'top');
  const middleBanners  = banners.filter((b: any) => b.position === 'middle');
  const bottomBanners  = banners.filter((b: any) => b.position === 'bottom');
  const sidebarBanners = banners.filter((b: any) => b.position === 'sidebar');

  return (
    <>
      <JDStoreAmbientBackground variant="home" intensity="medium" interactive={true} />
      
      <div className="relative z-10">
        {flashSale && (
          <div className="w-full bg-black/90 text-white backdrop-blur-md border-b border-white/10 relative z-[60]">
            <div className="absolute inset-0 bg-gradient-to-r from-luxe-accent/10 via-purple-500/10 to-cyan-500/10 opacity-50" />
            <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm sm:text-base font-medium">
              <div className="flex items-center gap-2">
                <span className="text-luxe-accent">⚡</span>
                <span className="tracking-wide text-gray-100">{flashSale.title}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-luxe-accent font-bold">
                  {flashSale.discount_percentage}% OFF
                </span>
              </div>
              <FlashSaleTimerClient endAt={flashSale.end_at} />
            </div>
          </div>
        )}

        {/* Hero-position banners */}
        <div className="pt-6 md:pt-8 pb-4">
          <BannersSection banners={heroBanners} />
        </div>

      {/* Top banners */}
      <div className="mb-4 lg:mb-6">
        <BannersSection banners={topBanners} />
      </div>

      {/* Best Sellers Section - Streamed via Suspense */}
      <div className="mb-4 lg:mb-6">
        <Suspense fallback={
          <div className="py-2"><div className="page-container"><ProductGridSkeleton count={4} /></div></div>
        }>
          <BestSellersData />
        </Suspense>
      </div>

      {/* Sidebar layout — desktop only */}
      <div className="page-container lg:flex lg:gap-6 mb-4 lg:mb-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 lg:mb-6">
            <Suspense fallback={
              <div className="py-2"><ProductGridSkeleton count={4} /></div>
            }>
              <TrendingData />
            </Suspense>
          </div>
          
          <div className="mb-4 lg:mb-6">
            <Suspense fallback={
              <div className="py-2"><div className="page-container"><ProductGridSkeleton count={8} /></div></div>
            }>
              <DynamicShowcaseData />
            </Suspense>
          </div>

          <div className="mb-4 lg:mb-6">
            <BannersSection banners={middleBanners} />
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

      <div className="mb-4 lg:mb-6">
        <CollectionsSection collections={collections} />
      </div>

      <div className="mb-4 lg:mb-6">
        <WhyChooseUs />
      </div>
      
      <div className="mb-4 lg:mb-6">
        <Suspense fallback={<div className="py-12 animate-pulse bg-white/5 rounded-3xl mx-4 md:mx-12 h-[300px]" />}>
          <TestimonialsData />
        </Suspense>
      </div>

      <div className="mb-4 lg:mb-6">
        <BannersSection banners={bottomBanners} />
      </div>

      <div className="mb-4 lg:mb-6">
        <Suspense fallback={<div className="py-12 animate-pulse bg-white/5 rounded-3xl mx-4 md:mx-12 h-[300px]" />}>
          <FAQData />
        </Suspense>
      </div>

      <ContactSection />
      </div>
    </>
  );
}

// ─── Data Fetcher Server Components ──────────────────────────────────────────

async function BestSellersData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('products').select('*, images:product_images(*), category:product_categories(*), sizes:poster_sizes(*)').eq('is_active', true).eq('is_best_seller', true).order('created_at', { ascending: false }).limit(4);
  return <BestSellers products={data || []} />;
}

async function DynamicShowcaseData() {
  const products = await getFeaturedProducts(16);
  return <DynamicShowcase products={products} />;
}

async function TestimonialsData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('testimonials').select('*').eq('is_active', true).order('display_order').limit(8);
  return <TestimonialsSection testimonials={data || []} />;
}

async function FAQData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('faqs').select('*').eq('is_active', true).order('display_order').limit(10);
  return <FAQSection faqs={data || []} />;
}

async function TrendingData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('products').select('*, images:product_images(*), category:product_categories(*), sizes:poster_sizes(*)').eq('is_active', true).eq('is_trending', true).order('created_at', { ascending: false }).limit(4);
  return <BestSellers products={data || []} title="Trending Products" subtitle="Hot Right Now" viewAllLink="/trending" noContainer />;
}