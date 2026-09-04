'use client';

import { motion } from 'framer-motion';
import { Ganesha } from './Ganesha';
import { Modak } from './Modak';
import { FestivalParticles } from './DiwaliParticles';

export function VinayagarDecorations() {
  return (
    <>
      <FestivalParticles color="#fb923c" glow="rgba(251, 146, 60, 0.8)" />

      {/* Background Ganesha silhouette — bottom right */}
      <motion.div
        className="absolute -right-10 -bottom-10 w-48 h-48 md:w-80 md:h-80 text-[#f97316] pointer-events-none z-0 opacity-20 md:opacity-30 will-change-transform"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
      >
        <Ganesha className="w-full h-full" />
      </motion.div>

      {/* Floating Modak — left side */}
      <motion.div
        className="absolute left-[5%] md:left-[10%] bottom-[25%] w-8 h-8 md:w-14 md:h-14 pointer-events-none z-0 opacity-40 md:opacity-70"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.5, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Modak className="w-full h-full drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]" />
        </motion.div>
      </motion.div>

      {/* Desktop-only Modak — top right */}
      <motion.div
        className="absolute right-[12%] top-[18%] w-10 h-10 pointer-events-none z-0 hidden md:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <Modak className="w-full h-full drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        </motion.div>
      </motion.div>

      {/* Bottom-right floating Modak — smaller on mobile */}
      <motion.div
        className="absolute right-[3%] md:right-[5%] bottom-[12%] w-10 h-10 md:w-16 md:h-16 pointer-events-none z-0 opacity-40 md:opacity-60"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.5, y: 0 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <Modak className="w-full h-full drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
        </motion.div>
      </motion.div>

      {/* Small Ganesha silhouette — top left, desktop only */}
      <motion.div
        className="absolute left-[3%] top-[10%] w-24 h-24 text-[#f97316] pointer-events-none z-0 hidden lg:block"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.6 }}
      >
        <Ganesha className="w-full h-full" />
      </motion.div>
    </>
  );
}
