'use client';

import { motion } from 'framer-motion';
import { Diya } from './Diya';
import { Rangoli } from './Rangoli';
import { DiwaliParticles } from './DiwaliParticles';

export function DiwaliDecorations() {
  return (
    <>
      <DiwaliParticles />
      
      {/* Background Rangoli — smaller on mobile */}
      <motion.div 
        className="absolute -right-10 -bottom-10 w-48 h-48 md:w-96 md:h-96 text-[#f59e0b] pointer-events-none z-0 opacity-30 md:opacity-50 will-change-transform"
        initial={{ opacity: 0, rotate: -20, scale: 0.9 }}
        animate={{ opacity: 0.3, rotate: 0, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
      >
        <Rangoli className="w-full h-full" />
      </motion.div>

      {/* Floating Diyas — repositioned for mobile */}
      <motion.div
        className="absolute left-[5%] md:left-[10%] bottom-[20%] w-10 h-10 md:w-16 md:h-16 pointer-events-none z-0 opacity-40 md:opacity-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Diya className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
        </motion.div>
      </motion.div>

      {/* Desktop-only diya — top right */}
      <motion.div
        className="absolute right-[15%] top-[15%] w-12 h-12 pointer-events-none z-0 hidden md:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.9 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Diya className="w-full h-full drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        </motion.div>
      </motion.div>

      {/* Bottom-right diya — smaller on mobile */}
      <motion.div
        className="absolute right-[3%] md:right-[5%] bottom-[10%] w-14 h-14 md:w-24 md:h-24 pointer-events-none z-0 opacity-40 md:opacity-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Diya className="w-full h-full drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
        </motion.div>
      </motion.div>
    </>
  );
}
