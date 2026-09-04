import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createPublicClient } from '@/lib/supabase/server';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createPublicClient();
  const [{ data: categories }, { data: festivalSetting }, { data: festivalTypeSetting }] = await Promise.all([
    supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('settings')
      .select('*')
      .eq('key', 'festival_theme_enabled')
      .maybeSingle(),
    supabase
      .from('settings')
      .select('*')
      .eq('key', 'festival_type')
      .maybeSingle(),
  ]);

  const isFestivalEnabled = festivalSetting ? (festivalSetting.value === true || festivalSetting.value === 'true') : false;
  const festivalType = festivalTypeSetting?.value as string | undefined;

  return (
    <div className="min-h-screen bg-luxe-black flex flex-col overflow-x-hidden relative">
      <Navbar categories={categories || []} isFestival={isFestivalEnabled} festivalType={festivalType} />
      {/* pt-14 = mobile navbar h-14; sm:pt-16 = sm navbar h-16; md:pt-20 = desktop h-20 */}
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32">{children}</main>
      <Footer />
    </div>
  );
}