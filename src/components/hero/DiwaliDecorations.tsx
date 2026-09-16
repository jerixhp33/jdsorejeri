'use client';

import { motion } from 'framer-motion';
import { SolidDiya } from './SolidDiya';
import { SolidDiwaliRangoli } from './SolidDiwaliRangoli';
import { Marigold } from './Marigold';
import { PetalParticles } from './PetalParticles';
import { ToranGarland } from './ToranGarland';
import { FloatingLotus } from './FloatingLotus';
import Image from 'next/image';

export function DiwaliDecorations() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Traditional Toran Header Garland */}
      <ToranGarland />

      {/* Gentle Floating Flower Petals */}
      <PetalParticles />

      {/* Large Background Rangoli - Center Focal Point (Fully Responsive 320px - 4K) */}
      <motion.div 
        className="absolute top-[8%] sm:top-[5%] left-1/2 -translate-x-1/2 w-[380px] xs:w-[480px] sm:w-[750px] md:w-[1050px] opacity-40 will-change-transform"
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <SolidDiwaliRangoli className="w-full h-full" />
      </motion.div>

      {/* Main Brass Diya Focal Point with Flickering Flame */}
      <motion.div
        className="absolute top-[14%] sm:top-[12%] left-1/2 -translate-x-1/2 w-[160px] xs:w-[200px] sm:w-[260px] md:w-[330px] opacity-95 drop-shadow-2xl"
        animate={{ y: [-6, 6, -6], scale: [1, 1.02, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya className="w-full h-full" />
      </motion.div>

      {/* Marigold Base Garland around Central Diya */}
      <div className="absolute top-[38%] sm:top-[38%] left-1/2 -translate-x-1/2 w-[220px] xs:w-[260px] sm:w-[320px] md:w-[420px] flex justify-between opacity-90">
        <Marigold className="w-8 xs:w-10 sm:w-14 md:w-18 h-8 xs:h-10 sm:h-14 md:h-18 -ml-3 mt-6 drop-shadow-md" />
        <Marigold className="w-12 xs:w-14 sm:w-18 md:w-22 h-12 xs:h-14 sm:h-18 md:h-22 drop-shadow-lg" />
        <Marigold className="w-8 xs:w-10 sm:w-14 md:w-18 h-8 xs:h-10 sm:h-14 md:h-18 -mr-3 mt-6 drop-shadow-md" />
      </div>

      {/* Side Brass Diyas - Floating Left & Right (Optimized for Mobile) */}
      <motion.div
        className="absolute top-[42%] left-[3%] xs:left-[6%] sm:left-[12%] md:left-[20%] w-8 xs:w-10 sm:w-14 md:w-20 h-auto opacity-85"
        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya className="w-full h-full drop-shadow-lg" />
      </motion.div>

      <motion.div
        className="absolute top-[40%] right-[3%] xs:right-[6%] sm:right-[12%] md:right-[20%] w-7 xs:w-9 sm:w-12 md:w-18 h-auto opacity-85"
        animate={{ y: [-4, 4, -4], rotate: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <SolidDiya className="w-full h-full drop-shadow-lg" />
      </motion.div>

      {/* Floating Lotus Flowers - Bottom Corners */}
      <motion.div
        className="absolute bottom-[8%] left-[2%] xs:left-[5%] w-12 xs:w-16 md:w-24 h-auto opacity-80"
        animate={{ y: [-4, 4, -4], rotate: [-6, 6, -6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FloatingLotus className="w-full h-full drop-shadow-md" />
      </motion.div>

      <motion.div
        className="absolute bottom-[6%] right-[2%] xs:right-[5%] w-12 xs:w-16 md:w-24 h-auto opacity-80"
        animate={{ y: [-5, 5, -5], rotate: [6, -6, 6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <FloatingLotus className="w-full h-full drop-shadow-md" />
      </motion.div>

      {/* Decorative Poster Product Cards (Natural Composition Framing - Mobile & Desktop) */}
      {/* Movie Poster Left */}
      <motion.div
        className="absolute top-[20%] left-[2%] xs:left-[4%] sm:left-[8%] md:left-[10%] w-[70px] xs:w-[85px] sm:w-[100px] md:w-[120px] aspect-[2/3] bg-white rounded-xl p-1 shadow-xl -rotate-12 opacity-80 sm:opacity-100"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [-5, 5, -5] }}
        transition={{ y: { duration: 7, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 1 }, scale: { duration: 1 } }}
      >
        <div className="w-full h-full bg-[#E5D5C5] rounded-lg overflow-hidden relative">
          <Image 
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80" 
            alt="Poster" 
            fill 
            className="object-cover opacity-85 mix-blend-multiply" 
          />
        </div>
      </motion.div>

      {/* Music Poster Right */}
      <motion.div
        className="absolute top-[16%] right-[2%] xs:right-[4%] sm:right-[8%] md:right-[10%] w-[65px] xs:w-[75px] sm:w-[90px] md:w-[105px] aspect-square bg-white rounded-xl p-1 shadow-xl rotate-6 opacity-80 sm:opacity-100"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [-4, 4, -4] }}
        transition={{ y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }, opacity: { duration: 1 }, scale: { duration: 1 } }}
      >
        <div className="w-full h-full bg-[#D97706] rounded-lg overflow-hidden relative">
          <Image 
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80" 
            alt="Vinyl" 
            fill 
            className="object-cover opacity-90 mix-blend-multiply" 
          />
        </div>
      </motion.div>
    </div>
  );
}
