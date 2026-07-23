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

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createPublicClient();
  
  // Fetch ONLY fast, layout-blocking data here to ensure rapid First Contentful Paint
  const [banners, collections, marqueeLabels] = await Promise.all([
    supabase.from('banners').select('id, title, subtitle, image_url, mobile_image_url, link, position, text_color, button_text, display_order').eq('is_active', true).order('display_order').then(({ data }) => data || []),
    supabase.from('collections').select('id, name, slug, image_url, description').eq('is_active', true).order('display_order').limit(4).then(({ data }) => data || []),
    supabase.from('marquee_labels').select('id, text, is_active, order_index').eq('is_active', true).order('order_index').then(({ data }) => data || []),
  ]);

  const heroBanners    = banners.filter((b: any) => b.position === 'hero');
  const topBanners     = banners.filter((b: any) => b.position === 'top');
  const middleBanners  = banners.filter((b: any) => b.position === 'middle');
  const bottomBanners  = banners.filter((b: any) => b.position === 'bottom');
  const sidebarBanners = banners.filter((b: any) => b.position === 'sidebar');

  return (
    <>
      {/* Hero-position banners */}
      <div className="pt-20 sm:pt-24 pb-4">
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
    </>
  );
}

// ─── Data Fetcher Server Components ──────────────────────────────────────────

async function BestSellersData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('products').select('id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating, images:product_images(id, url, alt_text, is_primary, display_order), category:product_categories(id, name, slug), sizes:poster_sizes(id, label, price, stock, is_active, sku)').eq('is_active', true).eq('is_best_seller', true).order('created_at', { ascending: false }).limit(4);
  return <BestSellers products={data || []} />;
}

async function DynamicShowcaseData() {
  const products = await getFeaturedProducts(16);
  return <DynamicShowcase products={products} />;
}

async function TestimonialsData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('testimonials').select('id, name, role, content, rating, avatar_url').eq('is_active', true).order('display_order').limit(8);
  return <TestimonialsSection testimonials={data || []} />;
}

async function FAQData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('faqs').select('id, question, answer').eq('is_active', true).order('display_order').limit(10);
  return <FAQSection faqs={data || []} />;
}

async function TrendingData() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('products').select('id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating, images:product_images(id, url, alt_text, is_primary, display_order), category:product_categories(id, name, slug), sizes:poster_sizes(id, label, price, stock, is_active, sku)').eq('is_active', true).eq('is_trending', true).order('created_at', { ascending: false }).limit(4);
  return <BestSellers products={data || []} title="Trending Products" subtitle="Hot Right Now" viewAllLink="/trending" noContainer />;
}