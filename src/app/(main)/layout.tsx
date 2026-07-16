import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return (
    <div className="min-h-screen bg-luxe-black flex flex-col overflow-x-hidden">
      <Navbar categories={categories || []} />
      {/* pt-14 = mobile navbar h-14; sm:pt-16 = sm navbar h-16; md:pt-20 = desktop h-20 */}
      <main className="flex-1 pt-14 sm:pt-16 md:pt-20">{children}</main>
      <Footer />
    </div>
  );
}