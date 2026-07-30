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
import { getActiveHomeTheme } from '@/lib/theme';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createPublicClient();
  
  // Fetch ONLY fast, layout-blocking data here to ensure rapid First Contentful Paint
  const [banners, collections, marqueeLabels, flashSale, homeTheme] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).order('display_order').then(({ data }) => data || []),
    supabase.from('collections').select('*').eq('is_active', true).order('display_order').limit(4).then(({ data }) => data || []),
    supabase.from('marquee_labels').select('*').eq('is_active', true).order('order_index').then(({ data }) => data || []),
    getActiveFlashSale(),
    getActiveHomeTheme(),
  ]);

  const heroBanners    = banners.filter((b: any) => b.position === 'hero');
  const topBanners     = banners.filter((b: any) => b.position === 'top');
  const middleBanners  = banners.filter((b: any) => b.position === 'middle');
  const bottomBanners  = banners.filter((b: any) => b.position === 'bottom');
  const sidebarBanners = banners.filter((b: any) => b.position === 'sidebar');

  return (
    <>
      <JDStoreAmbientBackground variant="home" intensity="medium" interactive={true} themeConfig={homeTheme} />
      
      <div className="relative z-10">
        {flashSale && (
          <div className="px-4 md:px-8 lg:px-12 max-w-[1400px] mx-auto w-full relative z-20 -mb-6 mt-4">
            <div className="w-full overflow-hidden bg-white/10 backdrop-blur-xl text-white border-t border-x border-white/20 rounded-t-3xl md:rounded-t-[2.5rem] py-2 shadow-lg">
              <div className="flex w-max animate-marquee">
                {[1, 2].map((blockId) => (
                  <div key={blockId} className="flex shrink-0 items-center whitespace-nowrap text-[10px] sm:text-xs font-extrabold tracking-widest uppercase">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={`${blockId}-${i}`} className="flex items-center mx-6 gap-6">
                        <span className="text-yellow-400 animate-pulse text-sm">⚡</span>
                        <span>{flashSale.title} • {flashSale.discount_percentage}% OFF</span>
                        <FlashSaleTimerClient endAt={flashSale.end_at} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero-position banners */}
        <div className="relative z-10">
          <BannersSection banners={heroBanners} isAttachedTop={!!flashSale} themeConfig={homeTheme} />
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