'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Collection } from '@/types';

interface CollectionsSectionProps {
  collections: Collection[];
}

function sampleColor(imgEl: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    const SIZE = 40;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(imgEl, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 16) {
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      const brightness = (pr + pg + pb) / 3;
      if (brightness > 20 && brightness < 235) {
        r += pr; g += pg; b += pb; count++;
      }
    }
    if (count === 0) return null;
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    const avg = (r + g + b) / 3;
    const SAT = 1.9;
    r = Math.min(255, Math.round(avg + (r - avg) * SAT));
    g = Math.min(255, Math.round(avg + (g - avg) * SAT));
    b = Math.min(255, Math.round(avg + (b - avg) * SAT));
    return `${r},${g},${b}`;
  } catch {
    return null;
  }
}

function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  const [glowColor, setGlowColor] = useState<string | null>(null);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const color = sampleColor(e.currentTarget as unknown as HTMLImageElement);
    if (color) setGlowColor(color);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      /* Wrapper: overflow visible so box-shadow bloom bleeds into page background */
      style={{
        position: 'relative',
        borderRadius: '1rem',
        transition: 'transform 0.5s ease',
        /* Adaptive ambient bloom — subtle, not blinding */
        ...(glowColor ? {
          boxShadow: `
            0 0 0 1px rgba(${glowColor},0.25),
            0 0 20px 4px rgba(${glowColor},0.10),
            0 8px 32px 0px rgba(${glowColor},0.12),
            0 18px 50px 0px rgba(${glowColor},0.07)
          `,
        } : {
          boxShadow: `
            0 0 0 1px rgba(200,169,110,0.12),
            0 4px 16px rgba(200,169,110,0.05)
          `,
        }),
      }}
      whileHover={{ y: -6 }}
    >
      <Link prefetch={true} href={`/collections/${collection.slug}`}
        className="group block relative overflow-hidden rounded-2xl border"
        style={glowColor ? {
          borderColor: `rgba(${glowColor},0.45)`,
          transition: 'border-color 0.7s ease',
        } : {
          borderColor: 'rgba(200,169,110,0.12)',
        }}
      >
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          {collection.cover_image_url ? (
            <>
              <Image
                src={collection.cover_image_url}
                alt={collection.name}
                fill
                crossOrigin="anonymous"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                onLoad={onImgLoad}
              />
              {/* Adaptive inner bottom bloom */}
              {glowColor && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 50% 100%, rgba(${glowColor},0.09) 0%, transparent 60%)`,
                    transition: 'opacity 0.7s ease',
                  }}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-luxe-gray to-luxe-dark flex items-center justify-center">
              <span className="text-white/10 text-6xl font-display font-bold">
                {collection.name[0]}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-white font-display text-xl font-bold mb-1">
            {collection.name}
          </h3>
          {collection.description && (
            <p className="text-white/50 text-sm line-clamp-2 mb-3">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-luxe-accent text-sm font-medium">
            Explore
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  if (!collections.length) return null;

  return (
    <section className="py-20 lg:py-28 bg-luxe-near-black">
      <div className="page-container">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-luxe-accent text-sm tracking-widest uppercase mb-3"
          >
            Curated
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-title"
          >
            Shop by Collection
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.map((collection, i) => (
            <CollectionCard key={collection.id} collection={collection} index={i} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link prefetch={true} href="/collections" className="btn-luxe-outline text-sm">
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
}