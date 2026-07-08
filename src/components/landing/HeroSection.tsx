'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import { ArrowRight, Star, Sparkles } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Wall Posters', 'Artisan Earrings', 'Premium Quality',
  'Museum-Grade Prints', 'Handcrafted', 'Tamil Nadu Delivery',
  'Limited Editions', 'Free Shipping',
];

// Subtext split into lyric phrases
const LYRIC_WORDS = [
  'Trending', 'wall', 'posters', 'and',
  'trending', 'earrings', 'with', 'a',
  'stylish,', 'modern', 'theme.', 'Art',
  'that', 'transforms', 'your', 'space.',
];

// ─── Colour-shifting headline word ───────────────────────────
const SHIFT_COLORS = [
  '#c8a96e', '#ffffff', '#e8c4a0', '#f5f5f5', '#e8d5a3', '#c8a96e',
];

function ColorShiftWord({ text }: { text: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SHIFT_COLORS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span
      animate={{ color: SHIFT_COLORS[idx] }}
      transition={{ duration: 1.4, ease: 'easeInOut' }}
      style={{ display: 'inline-block' }}
    >
      {text}
    </motion.span>
  );
}

// ─── Word-by-word 3D reveal ───────────────────────────────────
function SplitReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 24, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.09,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: 'top center' }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Karaoke / lyrics-sync subtext ───────────────────────────
function KaraokeText() {
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    const base = 1100;
    const timers: ReturnType<typeof setTimeout>[] = [];
    LYRIC_WORDS.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveIdx(i), base + i * 140));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      className="text-sm sm:text-base md:text-xl max-w-xs sm:max-w-sm md:max-w-lg mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed px-2"
      aria-label={LYRIC_WORDS.join(' ')}
    >
      {LYRIC_WORDS.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.28em] transition-all duration-300"
          animate={
            i === activeIdx
              ? { color: '#e8d5a3', textShadow: '0 0 18px rgba(232,213,163,0.7)', scale: 1.05 }
              : i < activeIdx
              ? { color: 'rgba(255,255,255,0.55)', textShadow: 'none', scale: 1 }
              : { color: 'rgba(255,255,255,0.25)', textShadow: 'none', scale: 1 }
          }
          transition={{ duration: 0.25 }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}

// ─── Button shimmer ───────────────────────────────────────────
function ShimmerButton({
  href,
  gold,
  children,
}: {
  href: string;
  gold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
      <Link prefetch={true} href={href}
        className={`relative group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-sm font-semibold overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md text-white hover:border-white/40 hover:bg-white/10 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
      >
        <span className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}

// ─── Corner brackets ─────────────────────────────────────────
function Brackets() {
  const cls = 'absolute w-4 h-4 sm:w-5 sm:h-5 border-luxe-accent/40';
  return (
    <>
      {[
        ['top-0 left-0 border-t border-l', 1.4],
        ['top-0 right-0 border-t border-r', 1.5],
        ['bottom-0 left-0 border-b border-l', 1.6],
        ['bottom-0 right-0 border-b border-r', 1.7],
      ].map(([pos, d], i) => (
        <motion.div
          key={i}
          className={`${cls} ${pos}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: d as number, duration: 0.35 }}
        />
      ))}
    </>
  );
}

// ─── Minimal ambient glow ─────────────────────────────────────
function AmbientGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 'min(600px, 100vw)',
          height: 'min(600px, 100vw)',
          background: 'radial-gradient(circle, rgba(200,169,110,0.055) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.97]);
  const springY = useSpring(y, { stiffness: 80, damping: 22 });

  const [marqueeItems, setMarqueeItems] = useState<string[]>(MARQUEE_ITEMS);

  // We need to ensure we have enough items to span a large screen twice for a seamless loop.
  // We use 40 to mathematically guarantee the text width massively exceeds any phone or ultra-wide monitor.
  const baseItems = marqueeItems.length > 0 ? marqueeItems : MARQUEE_ITEMS;
  const itemsToRender = Array(Math.max(1, Math.ceil(40 / baseItems.length))).fill(baseItems).flat();

  useEffect(() => {
    async function fetchMarquee() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('marquee_labels')
          .select('text')
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        
        if (data && data.length > 0) {
          setMarqueeItems(data.map(d => d.text));
        }
      } catch (e) {
        console.error('Failed to fetch marquee texts', e);
      }
    }
    fetchMarquee();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]"
      style={{ height: 'calc(100dvh - 3.5rem)', minHeight: '520px' }}
    >
      {/* Subtle grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.025, 0.04, 0.025] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage: 'linear-gradient(rgba(200,169,110,0.35) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 90% at 50% 50%, transparent 20%, #0a0a0a 65%)',
        }}
      />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <motion.p
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-white/30 text-[10px] tracking-[0.3em] uppercase"
        >
          Scroll
        </motion.p>
        <div className="relative w-px h-8 sm:h-10 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute top-0 left-0 right-0 rounded-full"
            style={{ height: '55%', background: 'linear-gradient(to bottom, #c8a96e, transparent)' }}
            animate={{ y: ['-100%', '220%'] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      <AmbientGlow />

      {/* Horizontal line accents */}
      {[{ top: '22%', delay: 1.8 }, { top: '78%', delay: 2.0 }].map((l, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: l.top,
            background:
              'linear-gradient(90deg, transparent, rgba(200,169,110,0.1) 30%, rgba(200,169,110,0.1) 70%, transparent)',
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: l.delay, duration: 1.2, ease: 'easeOut' }}
        />
      ))}

      {/* ── Content ── */}
      <motion.div
        style={mounted ? { y: springY, scale } : {}}
        className="relative z-10 w-full page-container text-center pt-4 sm:pt-6 md:pt-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="inline-flex items-center gap-2 px-5 py-2 mb-6 sm:mb-8 md:mb-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
        >
          <motion.span
            animate={{ rotate: [0, 18, -18, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 2.5 }}
          >
            <Star className="w-3 h-3 text-luxe-accent fill-current" />
          </motion.span>
          <span className="text-luxe-accent text-[11px] sm:text-xs font-medium tracking-wide">
            Premium Quality · Tamil Nadu Delivery
          </span>
        </motion.div>

        {/* Headline */}
        <div className="relative inline-block mb-3 sm:mb-4" style={{ perspective: '1200px' }}>
          <Brackets />
          <h1 className="font-display italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight px-6 sm:px-8 py-2 sm:py-3">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <ColorShiftWord text="Art" />{' '}
              <ColorShiftWord text="that" />
            </motion.span>

            <span className="block my-0.5 sm:my-1">
              <motion.span
                className="text-gradient-gold inline-block"
                initial={{ opacity: 0, y: 28, rotateX: -20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'top center' }}
              >
                transforms
              </motion.span>
            </span>

            <SplitReveal text="your space" className="block text-white" delay={0.8} />
          </h1>
        </div>

        {/* Karaoke subtext */}
        <KaraokeText />

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
        >
          <ShimmerButton href="/posters" gold>
            Shop Posters
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </ShimmerButton>
          <ShimmerButton href="/earrings">
            <Sparkles className="w-4 h-4 text-white/70" />
            Explore Earrings
          </ShimmerButton>
        </motion.div>
      </motion.div>

      {/* Smooth fade-out to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }}
      />

      {/* Marquee strip */}
      <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-black/60 backdrop-blur-md overflow-hidden py-3 sm:py-3.5">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />
        <div className="flex whitespace-nowrap animate-marquee w-max">
          {/* First identical half */}
          <div className="flex shrink-0">
            {itemsToRender.map((item, i) => (
              <span
                key={`h1-${i}`}
                className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 text-white/40 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-luxe-accent/50" />
                {item}
              </span>
            ))}
          </div>
          {/* Second identical half */}
          <div className="flex shrink-0">
            {itemsToRender.map((item, i) => (
              <span
                key={`h2-${i}`}
                className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 text-white/40 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-semibold"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-luxe-accent/50" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}