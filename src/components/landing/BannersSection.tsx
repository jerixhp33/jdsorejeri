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
    const imgEl = e.currentTarget as unknown as HTMLImageElement;
    setTimeout(() => {
      const color = sampleColor(imgEl);
      if (color) setGlowColor(color);
    }, 100);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full aspect-[21/7] min-h-[200px] max-h-[400px] rounded-3xl md:rounded-[2.5rem] group z-10"
      style={glowColor ? {
        boxShadow: `0 0 60px rgba(${glowColor},0.2), 0 20px 40px rgba(${glowColor},0.15)`,
        transition: 'box-shadow 0.7s ease',
      } : undefined}
    >
      {/* Ambient background bloom */}
      {glowColor && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(${glowColor}, 0.25) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Content wrapper */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] z-10">
        <Image
          src={banner.image_url}
          alt={banner.title || 'Banner'}
          fill
          crossOrigin="anonymous"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 1400px"
          priority={priority}
          onLoad={handleImageLoad}
        />

        {/* Clean, simple dark gradient just enough for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-20 z-20">
          <div className="max-w-xl">
            {banner.title && (
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-2"
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
                className="text-foreground/ text-xs md:text-base mb-6 leading-relaxed"
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
                    boxShadow: '0 0 24px rgba(200,169,110,0.25)',
                  }}
                >
                  {banner.cta_text}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </motion.div>
            )}
          </div>
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

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>, idx: number) => {
    const imgEl = e.currentTarget as unknown as HTMLImageElement;
    setTimeout(() => {
      const color = sampleColor(imgEl);
      if (color) setGlowColors((prev) => ({ ...prev, [idx]: color }));
    }, 100);
  }, []);

  const activeGlow = glowColors[current];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full aspect-[21/7] min-h-[200px] max-h-[400px] rounded-3xl md:rounded-[2.5rem] group z-10"
      style={activeGlow ? {
        boxShadow: `0 0 60px rgba(${activeGlow},0.2), 0 20px 40px rgba(${activeGlow},0.15)`,
        transition: 'box-shadow 0.7s ease',
      } : undefined}
    >
      {/* Ambient background bloom */}
      {activeGlow && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(${activeGlow}, 0.25) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Content wrapper */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] z-10">
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={banners[current].image_url}
              alt={banners[current].title || "Banner"}
              fill
              crossOrigin="anonymous"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 1400px"
              priority={current === 0}
              onLoad={(e) => handleImageLoad(e, current)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            
            <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-20 z-20">
              <div className="max-w-xl">
                {banners[current].title && (
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-2"
                    style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                  >
                    {banners[current].title}
                  </motion.h3>
                )}
                {banners[current].subtitle && (
                  <motion.p
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="text-foreground/ text-xs md:text-base mb-6 leading-relaxed"
                  >
                    {banners[current].subtitle}
                  </motion.p>
                )}
                {banners[current].cta_text && banners[current].cta_url && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                  >
                    <Link prefetch={true} href={banners[current].cta_url}
                      className="group/btn inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)',
                        color: '#0a0a0a',
                        boxShadow: '0 0 24px rgba(200,169,110,0.25)',
                      }}
                    >
                      {banners[current].cta_text}
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 bg-foreground/ hover:bg-foreground/ backdrop-blur-md text-foreground border border-foreground/"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 bg-foreground/ hover:bg-foreground/ backdrop-blur-md text-foreground border border-foreground/"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-white" : "bg-foreground/ hover:bg-foreground/"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── BannersSection ───────────────────────────────────────────────────────────

export function BannersSection({ banners }: BannersSectionProps) {
  if (!banners.length) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12 py-6 max-w-[1400px] mx-auto w-full">
      {banners.length === 1 ? (
        <SingleBanner banner={banners[0]} priority />
      ) : (
        <SliderBanners banners={banners} />
      )}
    </section>
  );
}

// ─── Sidebar banner card ──────────────────────────────────────────────────────

function SidebarBannerCard({ banner, priority }: { banner: Banner; priority: boolean }) {
  const [glowColor, setGlowColor] = useState<string | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget as unknown as HTMLImageElement;
    setTimeout(() => {
      const color = sampleColor(imgEl);
      if (color) setGlowColor(color);
    }, 100);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden card-edge-light group"
      style={glowColor ? {
        boxShadow: `0 0 40px rgba(${glowColor},0.15), 0 8px 24px rgba(${glowColor},0.1)`,
        transition: 'box-shadow 0.7s ease',
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
            className="font-display text-xl font-bold text-foreground leading-tight mb-1"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
          >
            {banner.title}
          </h3>
        )}

        {banner.subtitle && (
          <p className="text-foreground/ text-xs mb-4 leading-relaxed line-clamp-2">
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
    <div className="sticky top-24 flex flex-col gap-5 py-6">
      {banners.map((banner, i) => (
        <SidebarBannerCard key={banner.id} banner={banner} priority={i === 0} />
      ))}
    </div>
  );
}

// ─── Mobile Sidebar Banners ───────────────────────────────────────────────────
// Shown on mobile only (lg:hidden in page.tsx) — horizontal scroll strip
// positioned right after the hero, not buried below all products.

export function MobileSidebarBanners({ banners }: BannersSectionProps) {
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
    timerRef.current = setInterval(next, 5000); // 5s loop
  }, [next]);

  useEffect(() => {
    if (banners.length <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer, banners.length]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>, idx: number) => {
    const imgEl = e.currentTarget as unknown as HTMLImageElement;
    setTimeout(() => {
      const color = sampleColor(imgEl);
      if (color) setGlowColors((prev) => ({ ...prev, [idx]: color }));
    }, 100);
  }, []);

  if (!banners.length) return null;

  // If only 1 banner, render static card
  if (banners.length === 1) {
    return (
      <section className="px-4 py-8 max-w-[1400px] mx-auto flex justify-center">
        <MobileSidebarCard banner={banners[0]} priority={true} />
      </section>
    );
  }

  const activeGlow = glowColors[current];

  const getDiff = (i: number) => {
    let diff = i - current;
    const half = banners.length / 2;
    if (diff < -half) diff += banners.length;
    else if (diff > half) diff -= banners.length;
    return diff;
  };

  return (
    <section className="relative w-full py-6">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <AnimatePresence>
          {activeGlow && (
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute w-full h-[150%] max-w-[600px]"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(${activeGlow}, 0.2) 0%, transparent 60%)`,
                filter: 'blur(40px)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 3D Coverflow Container */}
      <div className="relative w-full h-[400px] flex items-center justify-center z-10 perspective-[1000px]">
        {banners.map((banner, i) => {
          const diff = getDiff(i);
          const isCenter = diff === 0;
          const absDiff = Math.abs(diff);
          
          // Mobile coverflow math
          const xOffset = diff * 55; // percentage shift horizontally
          const scale = isCenter ? 1 : Math.max(0.7, 0.85 - (absDiff * 0.05));
          const zIndex = 50 - absDiff;
          const opacity = isCenter ? 1 : absDiff <= 2 ? 1 - (absDiff * 0.35) : 0;
          const pointerEvents = opacity === 0 ? 'none' : 'auto';

          return (
            <motion.div
              key={banner.id}
              className="absolute w-[65vw] max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              animate={{
                x: `${xOffset}%`,
                scale,
                opacity,
                zIndex,
                filter: isCenter ? 'blur(0px)' : 'blur(4px)',
              }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              onClick={() => {
                if (!isCenter) setCurrent(i);
              }}
              style={{
                pointerEvents: pointerEvents as any,
                boxShadow: isCenter 
                  ? '0 20px 40px rgba(0,0,0,0.5)'
                  : '0 10px 20px rgba(0,0,0,0.4)',
              }}
            >
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                crossOrigin="anonymous"
                className="object-cover"
                sizes="280px"
                priority={isCenter}
                onLoad={(e) => handleImageLoad(e, i)}
              />
              
              <motion.div 
                className="absolute inset-0 bg-background"
                animate={{ opacity: isCenter ? 0 : 0.4 }}
                transition={{ duration: 1.2 }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
              
              <motion.div 
                className="absolute inset-0 flex flex-col justify-end p-5"
                animate={{ opacity: isCenter ? 1 : 0 }}
                transition={{ duration: 1.0 }}
              >
                 <div className="w-6 h-0.5 bg-[#c8a96e] mb-3" />
                 {banner.title && (
                   <h3 className="font-display text-lg font-bold text-foreground mb-2 leading-tight" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                     {banner.title}
                   </h3>
                 )}
                 {banner.subtitle && (
                   <p className="text-foreground/ text-xs mb-4 line-clamp-2">
                     {banner.subtitle}
                   </p>
                 )}
                 {banner.cta_text && banner.cta_url && (
                   <Link prefetch={true} href={banner.cta_url}
                     onClick={(e) => {
                       if (!isCenter) e.preventDefault();
                       else e.stopPropagation();
                     }}
                     className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs self-start"
                     style={{
                       background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)',
                       color: '#0a0a0a',
                       pointerEvents: isCenter ? 'auto' : 'none',
                     }}
                   >
                     {banner.cta_text}
                     <ArrowRight className="w-3 h-3" />
                   </Link>
                 )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function MobileSidebarCard({ banner, priority }: { banner: Banner; priority: boolean }) {
  const [glowColor, setGlowColor] = useState<string | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget as unknown as HTMLImageElement;
    setTimeout(() => {
      const color = sampleColor(imgEl);
      if (color) setGlowColor(color);
    }, 100);
  }, []);

  return (
    <div
      className="relative flex-shrink-0 w-[72vw] max-w-[280px] overflow-hidden rounded-2xl group"
      style={glowColor ? {
        boxShadow: `0 0 40px rgba(${glowColor},0.2)`,
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
            className="font-display text-base font-bold text-foreground leading-snug mb-1"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
          >
            {banner.title}
          </h3>
        )}

        {banner.subtitle && (
          <p className="text-foreground/ text-[11px] mb-3 leading-relaxed line-clamp-2">
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