'use client';

import { motion } from 'framer-motion';
import { SolidDiya } from './SolidDiya';
import { SolidDiwaliRangoli } from './SolidDiwaliRangoli';
import { Marigold } from './Marigold';
import { PetalParticles } from './PetalParticles';
import Image from 'next/image';

export function DiwaliDecorations() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Gentle Floating Flower Petals */}
      <PetalParticles />

      {/* Large Background Rangoli - Center Focal Point */}
      <motion.div 
        className="absolute top-[10%] sm:top-[5%] left-1/2 -translate-x-1/2 w-[120%] sm:w-[800px] md:w-[1000px] opacity-40 will-change-transform"
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <SolidDiwaliRangoli className="w-full h-full" />
      </motion.div>

      {/* Main Brass Diya Focal Point */}
      <motion.div
        className="absolute top-[15%] md:top-[12%] left-1/2 -translate-x-1/2 w-[200px] md:w-[320px] opacity-95 drop-shadow-2xl"
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya className="w-full h-full" />
      </motion.div>

      {/* Marigold Base Garland around Central Diya */}
      <div className="absolute top-[40%] md:top-[38%] left-1/2 -translate-x-1/2 w-[240px] md:w-[380px] flex justify-between opacity-90">
        <Marigold className="w-10 md:w-16 h-10 md:h-16 -ml-4 mt-8 drop-shadow-md" />
        <Marigold className="w-14 md:w-20 h-14 md:h-20 drop-shadow-lg" />
        <Marigold className="w-10 md:w-16 h-10 md:h-16 -mr-4 mt-8 drop-shadow-md" />
      </div>

      {/* Side Brass Diyas - Floating Left & Right */}
      <motion.div
        className="absolute top-[42%] left-[12%] md:left-[22%] w-12 md:w-20 h-auto opacity-85"
        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya className="w-full h-full drop-shadow-lg" />
      </motion.div>

      <motion.div
        className="absolute top-[40%] right-[12%] md:right-[22%] w-10 md:w-16 h-auto opacity-85"
        animate={{ y: [-4, 4, -4], rotate: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <SolidDiya className="w-full h-full drop-shadow-lg" />
      </motion.div>

      {/* Decorative Poster Product Cards (Natural Composition Framing) */}
      {/* Movie Poster Left */}
      <motion.div
        className="absolute hidden md:block top-[22%] left-[10%] w-[120px] aspect-[2/3] bg-white rounded-xl p-1 shadow-xl -rotate-12"
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
        className="absolute hidden md:block top-[18%] right-[10%] w-[105px] aspect-square bg-white rounded-xl p-1 shadow-xl rotate-6"
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
