export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Explore our curated collections of wall posters and earrings.',
};

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return (
    <div className="page-container py-10 md:py-16">
      <div className="mb-12">
        <p className="text-luxe-accent text-sm tracking-widest uppercase mb-3">Curated</p>
        <h1 className="section-title">Collections</h1>
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group block relative overflow-hidden rounded-2xl bg-luxe-dark border border-white/5 hover:border-white/20 transition-all duration-500"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                {collection.cover_image_url ? (
                  <Image
                    src={collection.cover_image_url}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-luxe-gray to-luxe-dark flex items-center justify-center">
                    <span className="text-white/10 text-6xl font-display font-bold">
                      {collection.name[0]}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="text-white font-display text-xl font-bold mb-1">{collection.name}</h2>
                {collection.description && (
                  <p className="text-white/50 text-sm line-clamp-2 mb-3">{collection.description}</p>
                )}
                <div className="flex items-center gap-1 text-luxe-accent text-sm font-medium">
                  View collection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-white/30">No collections yet. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
