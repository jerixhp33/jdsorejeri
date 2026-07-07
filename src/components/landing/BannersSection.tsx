'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
              <Link
                href={banner.cta_url}
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

// ─── SliderBanners ────────────────────────────────────────────────────────────

function SliderBanners({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [glowColors, setGlowColors] = useState<Record<number, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = (idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(idx);
    resetTimer();
  };

  const prev = () => go((current - 1 + banners.length) % banners.length, -1);
  const next = () => go((current + 1) % banners.length, 1);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [banners.length]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>, idx: number) => {
    const color = sampleColor(e.currentTarget as unknown as HTMLImageElement);
    if (color) setGlowColors((prev) => ({ ...prev, [idx]: color }));
  }, []);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '6%' : '-6%', opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? '-6%' : '6%', opacity: 0, scale: 0.98 }),
  };

  const banner = banners[current];
  const glowColor = glowColors[current] ?? null;

  return (
    <div
      className="relative w-full overflow-visible rounded-3xl group"
      style={{
        transition: 'box-shadow 0.7s ease',
        ...(glowColor ? {
          boxShadow: `
            0 0 0 1px rgba(${glowColor},0.18),
            0 0 24px 4px rgba(${glowColor},0.08),
            0 8px 36px 0px rgba(${glowColor},0.10),
            0 20px 50px 0px rgba(${glowColor},0.06)
          `,
        } : {}),
      }}
    >
      {/* Adaptive background bloom */}
      {glowColor && (
        <div
          className="absolute -inset-8 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(${glowColor},0.07) 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative w-full aspect-[21/7] min-h-[200px] max-h-[400px] overflow-hidden rounded-3xl z-10">
        <AnimatePresence custom={direction} mode="sync">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              crossOrigin="anonymous"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1400px"
              priority
              onLoad={(e) => handleImageLoad(e, current)}
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Adaptive inner glow for current slide */}
            {glowColor && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                style={{
                  background: `radial-gradient(ellipse at 50% 90%, rgba(${glowColor},0.06) 0%, transparent 55%)`,
                }}
              />
            )}

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Preload all banner images off-screen to sample their colors */}
        {banners.map((b, i) =>
          i !== current ? (
            <Image
              key={b.id}
              src={b.image_url}
              alt=""
              fill
              crossOrigin="anonymous"
              className="opacity-0 pointer-events-none absolute"
              sizes="1px"
              onLoad={(e) => handleImageLoad(e, i)}
            />
          ) : null
        )}

        {/* Content */}
        <div className="absolute inset-0 flex items-center px-10 md:px-16 lg:px-20 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="max-w-xl"
            >
              <div className="w-10 h-0.5 bg-[#c8a96e] mb-4" />
              {banner.title && (
                <h3
                  className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2"
                  style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                >
                  {banner.title}
                </h3>
              )}
              {banner.subtitle && (
                <p className="text-white/70 text-sm md:text-base mb-6 leading-relaxed">
                  {banner.subtitle}
                </p>
              )}
              {banner.cta_text && banner.cta_url && (
                <Link
                  href={banner.cta_url}
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
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? 1 : -1)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 h-1.5 bg-[#c8a96e]'
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      </div>
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
          <Link
            href={banner.cta_url}
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
          <Link
            href={banner.cta_url}
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