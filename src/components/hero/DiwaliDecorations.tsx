'use client';

import { motion } from 'framer-motion';
import { Diya } from './Diya';
import { Rangoli } from './Rangoli';
import { DiwaliParticles } from './DiwaliParticles';

export function DiwaliDecorations() {
  return (
    <>
      <DiwaliParticles />
      
      {/* Background Rangoli */}
      <motion.div 
        className="absolute -right-20 -bottom-20 w-96 h-96 text-[#f59e0b] pointer-events-none z-0 opacity-50 will-change-transform"
        initial={{ opacity: 0, rotate: -20, scale: 0.9 }}
        animate={{ opacity: 0.5, rotate: 0, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
      >
        <Rangoli className="w-full h-full" />
      </motion.div>

      {/* Floating Diyas */}
      <motion.div
        className="absolute left-[10%] bottom-[20%] w-16 h-16 pointer-events-none z-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Diya className="w-full h-full drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute right-[15%] top-[15%] w-12 h-12 pointer-events-none z-30 hidden md:block"
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

      <motion.div
        className="absolute right-[5%] bottom-[10%] w-24 h-24 pointer-events-none z-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Diya className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
        </motion.div>
      </motion.div>
    </>
  );
}
