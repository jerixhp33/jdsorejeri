import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createPublicClient } from '@/lib/supabase/server';
import { getActiveFlashSale } from '@/lib/flash-sales';
import { FlashSaleTimerClient } from '@/components/layout/FlashSaleTimerClient';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createPublicClient();
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const flashSale = await getActiveFlashSale();

  return (
    <div className="min-h-screen bg-luxe-black flex flex-col overflow-x-hidden relative">
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
      <Navbar categories={categories || []} hasBanner={!!flashSale} />
      {/* pt-14 = mobile navbar h-14; sm:pt-16 = sm navbar h-16; md:pt-20 = desktop h-20 */}
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32">{children}</main>
      <Footer />
    </div>
  );
}