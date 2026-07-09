export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight } from 'lucide-react';
import { CollectionCard } from '@/components/landing/CollectionsSection';

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
    <div className="page-container pt-28 pb-8 sm:pt-32 sm:pb-10 md:pt-36 md:pb-16">
      <div className="mb-8 sm:mb-12">
        <p className="text-luxe-accent text-xs sm:text-sm tracking-widest uppercase mb-2 sm:mb-3">Curated</p>
        <h1 className="section-title">Collections</h1>
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {collections.map((collection, index) => (
            <CollectionCard key={collection.id} collection={collection} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 sm:py-24">
          <p className="text-white/30">No collections yet. Check back soon.</p>
        </div>
      )}
    </div>
  );
}