'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ambient Diwali Sound — Synthesized temple bell chime using Web Audio API.
 * No external audio files needed. User must click to enable (browser autoplay policy).
 */
export function DiwaliAmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Respect reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) setIsVisible(false);
    }
  }, []);

  const playBellChime = useCallback((ctx: AudioContext) => {
    // Bell fundamental
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime); // 800-1200Hz bell range
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);

    // Harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1600 + Math.random() * 200, ctx.currentTime);
    gain2.gain.setValueAtTime(0.03, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 1.5);
  }, []);

  const toggleSound = useCallback(() => {
    if (isPlaying) {
      // Stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      audioCtxRef.current = null;
      intervalRef.current = null;
      setIsPlaying(false);
    } else {
      // Start
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Play first chime immediately
      playBellChime(ctx);

      // Then play every 4-6 seconds with variation
      intervalRef.current = setInterval(() => {
        if (ctx.state === 'running') {
          playBellChime(ctx);
        }
      }, 4000 + Math.random() * 2000);

      setIsPlaying(true);
    }
  }, [isPlaying, playBellChime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleSound}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isPlaying
            ? 'bg-[#2C1810] border-2 border-[#F59E0B]/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            : 'bg-[#2C1810]/80 border border-white/10 hover:border-[#F59E0B]/30'
        }`}
        title={isPlaying ? 'Mute Diwali ambient sound' : 'Play Diwali ambient sound'}
        aria-label={isPlaying ? 'Mute ambient sound' : 'Play ambient sound'}
      >
        <span className="text-lg">{isPlaying ? '🔔' : '🔕'}</span>
      </motion.button>
    </AnimatePresence>
  );
}
