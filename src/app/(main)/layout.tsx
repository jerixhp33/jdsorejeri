import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createPublicClient } from '@/lib/supabase/server';
import { FestivalBanner } from '@/components/layout/FestivalBanner';

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

  return (
    <div className="min-h-screen bg-luxe-black flex flex-col overflow-x-hidden relative">
      <div className="sticky top-0 z-[60] w-full">
        <FestivalBanner />
        <Navbar categories={categories || []} />
      </div>
      {/* pt-14 = mobile navbar h-14; sm:pt-16 = sm navbar h-16; md:pt-20 = desktop h-20 */}
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32">{children}</main>
      <Footer />
    </div>
  );
}