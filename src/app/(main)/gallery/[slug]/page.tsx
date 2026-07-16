import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ReadOnlyGallery from './ReadOnlyGallery';

export const metadata = {
  title: 'Gallery Design | Luxe Store',
  description: 'A beautiful gallery wall layout created by a Luxe Store user.',
};

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: layout, error } = await supabase
    .from('saved_layouts')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (error || !layout) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      <header className="absolute top-0 inset-x-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <h1 className="font-display text-2xl font-bold text-white uppercase tracking-widest pointer-events-auto">
          Luxe <span className="text-[#c8a96e]">Store</span>
        </h1>
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
          <span className="text-white/80 text-sm font-medium">Shared Gallery Design</span>
        </div>
      </header>

      <main className="flex-1 relative">
        <ReadOnlyGallery layout={layout} />
      </main>
    </div>
  );
}
