'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Banner } from '@/types';

interface BannersSectionProps {
  banners: Banner[];
}

// ─── Shared color sampler ────────────────────────────────────────────────────

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
    const SAT = 1.8;
    r = Math.min(255, Math.round(avg + (r - avg) * SAT));
    g = Math.min(255, Math.round(avg + (g - avg) * SAT));
    b = Math.min(255, Math.round(avg + (b - avg) * SAT));
    return `${r},${g},${b}`;
  } catch {
    return null;
  }
}

// ─── SingleBanner ─────────────────────────────────────────────────────────────

function SingleBanner({ banner, priority }: { banner: Banner; priority: boolean }) {
  const [glowColor, setGlowColor] = useState<string | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const color = sampleColor(e.currentTarget as unknown as HTMLImageElement);
    if (color) setGlowColor(color);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-visible rounded-3xl group"
      style={{
        minHeight: '220px',
        transition: 'box-shadow 0.7s ease',
        ...(glowColor ? {
          boxShadow: `
            0 0 0 1px rgba(${glowColor},0.18),
            0 0 24px 4px rgba(${glowColor},0.08),
            0 8px 36px 0px rgba(${glowColor},0.10),
            0 20px 50px 0px rgba(${glowColor},0.06)
          `,
          borderRadius: '1.5rem',
        } : {}),
      }}
    >
      {/* Adaptive background bloom — bleeds outside card */}
      {glowColor && (
        <div
          className="absolute -inset-8 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(${glowColor},0.07) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Image with zoom-on-hover */}
      <div className="relative w-full aspect-[21/7] min-h-[200px] max-h-[400px] overflow-hidden rounded-3xl z-10">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          crossOrigin="anonymous"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 1400px"
          priority={priority}
          onLoad={handleImageLoad}
        />

        {/* Multi-layer cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Adaptive inner glow */}
        {glowColor && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background: `radial-gradient(ellipse at 50% 90%, rgba(${glowColor},0.06) 0%, transparent 55%)`,
            }}
          />
        )}

        {/* Gold shimmer lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />

        {/* Animated shimmer sweep */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(200,169,110,0.06) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center px-10 md:px-16 lg:px-20 z-20">
        <div className="max-w-xl">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-10 h-0.5 bg-[#c8a96e] mb-4 origin-left"
          />

          {banner.title && (
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
            >
              {banner.title}
            </motion.h3>
          )}

          {banner.subtitle && (
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-white/70 text-sm md:text-base mb-6 leading-relaxed"
            >
              {banner.subtitle}
            </motion.p>
          )}

          {banner.cta_text && banner.cta_url && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Link prefetch={true} href={banner.cta_url}
                className="group/btn inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)',
                  color: '#0a0a0a',
                  boxShadow: '0 0 24px rgba(200,169,110,0.35)',
                }}
              >
                {banner.cta_text}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SliderBanners({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [glowColors, setGlowColors] = useState<Record<number, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 1500); // 1.5s loop
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>, idx: number) => {
    const color = sampleColor(e.currentTarget as unknown as HTMLImageElement);
    if (color) setGlowColors((prev) => ({ ...prev, [idx]: color }));
  }, []);

  const activeGlow = glowColors[current];

  // Helper to calculate shortest distance around the infinite loop
  const getDiff = (i: number) => {
    let diff = i - current;
    const half = banners.length / 2;
    if (diff < -half) diff += banners.length;
    else if (diff > half) diff -= banners.length;
    return diff;
  };

  return (
    <div 
      className="relative w-full py-16 overflow-hidden group"
      onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }}
      onMouseLeave={resetTimer}
    >
      {/* Ambient background glow (YouTube style) - soft, diffuse, less glow */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {activeGlow && (
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute w-full h-[150%] max-w-[1200px]"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(${activeGlow}, 0.12) 0%, transparent 60%)`,
                filter: 'blur(80px)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] flex items-center justify-center z-10 perspective-[1200px]">
        {banners.map((banner, i) => {
          const diff = getDiff(i);
          const isCenter = diff === 0;
          const absDiff = Math.abs(diff);
          
          // Math for the coverflow positions
          const xOffset = diff * 50; // percentage shift horizontally
          const scale = isCenter ? 1 : Math.max(0.7, 0.85 - (absDiff * 0.05));
          const zIndex = 50 - absDiff;
          const opacity = isCenter ? 1 : absDiff <= 2 ? 1 - (absDiff * 0.35) : 0;
          const pointerEvents = opacity === 0 ? 'none' : 'auto';

          return (
            <motion.div
              key={banner.id}
              className="absolute w-[80%] max-w-[800px] h-full rounded-[2rem] overflow-hidden cursor-pointer"
              animate={{
                x: `${xOffset}%`,
                scale,
                opacity,
                zIndex,
                filter: isCenter ? 'blur(0px)' : 'blur(4px)',
              }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1] // Apple-like smooth spring curve
              }}
              onClick={() => {
                if (!isCenter) setCurrent(i);
              }}
              style={{
                pointerEvents: pointerEvents as any,
                boxShadow: isCenter 
                  ? '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                crossOrigin="anonymous"
                className="object-cover"
                sizes="(max-width: 1024px) 80vw, 800px"
                priority={isCenter}
                onLoad={(e) => handleImageLoad(e, i)}
              />
              
              {/* Overlays for depth and text legibility */}
              <motion.div 
                className="absolute inset-0 bg-black"
                animate={{ opacity: isCenter ? 0 : 0.4 }}
                transition={{ duration: 0.7 }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90" />
              
              {/* Banner content (only visible on center card) */}
              <motion.div 
                className="absolute inset-0 flex flex-col justify-end p-8 md:p-14"
                animate={{ opacity: isCenter ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              >
                 <div className="w-10 h-1 bg-[#c8a96e] mb-5" />
                 <h3 className="font-display text-3xl md:text-5xl font-bold text-white mb-3 leading-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
                   {banner.title}
                 </h3>
                 <p className="text-white/80 text-sm md:text-lg mb-8 line-clamp-2 max-w-xl font-medium">
                   {banner.subtitle}
                 </p>
                 {banner.cta_text && banner.cta_url && (
                   <Link prefetch={true} href={banner.cta_url}
                     onClick={(e) => {
                       if (!isCenter) e.preventDefault();
                       else e.stopPropagation();
                     }}
                     className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm self-start transition-transform hover:scale-105"
                     style={{
                       background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)',
                       color: '#0a0a0a',
                       pointerEvents: isCenter ? 'auto' : 'none',
                     }}
                   >
                     {banner.cta_text}
                     <ArrowRight className="w-4 h-4" />
                   </Link>
                 )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Prev / Next controls */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white border border-white/10 hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white border border-white/10 hover:scale-110"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

// ─── BannersSection ───────────────────────────────────────────────────────────

export function BannersSection({ banners }: BannersSectionProps) {
  if (!banners.length) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12 py-10 max-w-[1400px] mx-auto">
      {/* Gold border accent above */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent mb-8" />

      {banners.length === 1 ? (
        <SingleBanner banner={banners[0]} priority />
      ) : (
        <SliderBanners banners={banners} />
      )}

      {/* Gold border accent below */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent mt-8" />
    </section>
  );
}

// ─── Sidebar banner card ──────────────────────────────────────────────────────

function SidebarBannerCard({ banner, priority }: { banner: Banner; priority: boolean }) {
  const [glowColor, setGlowColor] = useState<string | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const color = sampleColor(e.currentTarget as unknown as HTMLImageElement);
    if (color) setGlowColor(color);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden card-edge-light group"
      style={glowColor ? {
        boxShadow: `0 0 0 1px rgba(${glowColor},0.22), 0 8px 24px rgba(${glowColor},0.12), 0 2px 8px rgba(${glowColor},0.08)`,
        borderColor: `rgba(${glowColor},0.25)`,
        transition: 'box-shadow 0.7s ease, border-color 0.7s ease',
      } : undefined}
    >
      {/* Adaptive background bloom */}
      {glowColor && (
        <div
          className="absolute -inset-4 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(${glowColor},0.08) 0%, transparent 62%)`,
          }}
        />
      )}

      {/* Image */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[inherit] z-10">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          crossOrigin="anonymous"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 288px"
          priority={priority}
          onLoad={handleImageLoad}
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />

        {/* Adaptive inner glow overlay */}
        {glowColor && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background: `radial-gradient(ellipse at 50% 90%, rgba(${glowColor},0.06) 0%, transparent 58%)`,
            }}
          />
        )}

        {/* Hover shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(200,169,110,0.07) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
        <div className="w-6 h-0.5 bg-[#c8a96e] mb-3" />

        {banner.title && (
          <h3
            className="font-display text-xl font-bold text-white leading-tight mb-1"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
          >
            {banner.title}
          </h3>
        )}

        {banner.subtitle && (
          <p className="text-white/65 text-xs mb-4 leading-relaxed line-clamp-2">
            {banner.subtitle}
          </p>
        )}

        {banner.cta_text && banner.cta_url && (
          <Link prefetch={true} href={banner.cta_url}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs transition-all duration-300 self-start"
            style={{
              background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)',
              color: '#0a0a0a',
              boxShadow: '0 0 16px rgba(200,169,110,0.30)',
            }}
          >
            {banner.cta_text}
            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/**
 * SidebarBannersPanel — stacked vertical cards used in the sticky sidebar.
 * Exported so page.tsx can place it inside the aside column.
 */
export function SidebarBannersPanel({ banners }: BannersSectionProps) {
  if (!banners.length) return null;

  return (
    <div className="sticky top-24 flex flex-col gap-5 py-10">
      {/* Top gold accent */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent" />

      {banners.map((banner, i) => (
        <SidebarBannerCard key={banner.id} banner={banner} priority={i === 0} />
      ))}

      {/* Bottom gold accent */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent" />
    </div>
  );
}

// ─── Mobile Sidebar Banners ───────────────────────────────────────────────────
// Shown on mobile only (lg:hidden in page.tsx) — horizontal scroll strip
// positioned right after the hero, not buried below all products.

export function MobileSidebarBanners({ banners }: BannersSectionProps) {
  if (!banners.length) return null;

  return (
    <section className="px-4 py-6 max-w-[1400px] mx-auto">
      {/* Gold accent line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/25 to-transparent mb-5" />

      {/* Horizontal scroll strip — one card per banner */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {banners.map((banner, i) => (
          <MobileSidebarCard key={banner.id} banner={banner} priority={i === 0} />
        ))}
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8a96e]/25 to-transparent mt-5" />
    </section>
  );
}

function MobileSidebarCard({ banner, priority }: { banner: Banner; priority: boolean }) {
  const [glowColor, setGlowColor] = useState<string | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const color = sampleColor(e.currentTarget as unknown as HTMLImageElement);
    if (color) setGlowColor(color);
  }, []);

  return (
    <div
      className="relative flex-shrink-0 w-[72vw] max-w-[280px] overflow-hidden rounded-2xl group"
      style={glowColor ? {
        boxShadow: `0 0 0 1px rgba(${glowColor},0.18), 0 4px 16px rgba(${glowColor},0.08)`,
        transition: 'box-shadow 0.7s ease',
      } : {
        boxShadow: '0 0 0 1px rgba(200,169,110,0.08)',
      }}
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          crossOrigin="anonymous"
          className="object-cover transition-transform duration-700 group-active:scale-105"
          sizes="280px"
          priority={priority}
          onLoad={handleImageLoad}
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />

        {/* Adaptive inner glow */}
        {glowColor && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 95%, rgba(${glowColor},0.05) 0%, transparent 55%)`,
            }}
          />
        )}

        {/* Gold shimmer lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="w-5 h-0.5 bg-[#c8a96e] mb-2" />

        {banner.title && (
          <h3
            className="font-display text-base font-bold text-white leading-snug mb-1"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
          >
            {banner.title}
          </h3>
        )}

        {banner.subtitle && (
          <p className="text-white/60 text-[11px] mb-3 leading-relaxed line-clamp-2">
            {banner.subtitle}
          </p>
        )}

        {banner.cta_text && banner.cta_url && (
          <Link prefetch={true} href={banner.cta_url}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-[11px] self-start"
            style={{
              background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)',
              color: '#0a0a0a',
            }}
          >
            {banner.cta_text}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}