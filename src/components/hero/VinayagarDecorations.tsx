'use client';

import { motion } from 'framer-motion';
import { SolidGanesha } from './SolidGanesha';
import { SolidRangoli } from './SolidRangoli';
import { BananaLeaf } from './BananaLeaf';
import { Marigold } from './Marigold';
import { Modak } from './Modak';
import { PetalParticles } from './PetalParticles';
import Image from 'next/image';

export function VinayagarDecorations() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <PetalParticles />

      {/* Large Background Rangoli - Center Focal Point */}
      <motion.div 
        className="absolute top-[10%] sm:top-[5%] left-1/2 -translate-x-1/2 w-[120%] sm:w-[800px] md:w-[1000px] opacity-40 will-change-transform"
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <SolidRangoli className="w-full h-full" />
      </motion.div>

      {/* Banana Leaves Framing (Top Left & Top Right) */}
      <motion.div
        className="absolute -top-10 -left-10 md:top-10 md:-left-20 w-48 md:w-80 h-auto opacity-60 origin-top-left"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BananaLeaf className="w-full h-full -rotate-45" />
      </motion.div>
      <motion.div
        className="absolute -top-10 -right-10 md:top-10 md:-right-20 w-48 md:w-80 h-auto opacity-60 origin-top-right transform scale-x-[-1]"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <BananaLeaf className="w-full h-full rotate-45" />
      </motion.div>

      {/* Main Ganesha Focal Point */}
      <motion.div
        className="absolute top-[15%] md:top-[12%] left-1/2 -translate-x-1/2 w-[220px] md:w-[350px] opacity-95 drop-shadow-2xl"
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidGanesha className="w-full h-full" />
      </motion.div>

      {/* Marigold Base / Garland around Ganesha */}
      <div className="absolute top-[40%] md:top-[38%] left-1/2 -translate-x-1/2 w-[250px] md:w-[400px] flex justify-between opacity-90">
        <Marigold className="w-12 md:w-16 h-12 md:h-16 -ml-4 mt-8 drop-shadow-md" />
        <Marigold className="w-16 md:w-20 h-16 md:h-20 drop-shadow-lg" />
        <Marigold className="w-12 md:w-16 h-12 md:h-16 -mr-4 mt-8 drop-shadow-md" />
      </div>

      {/* Scattered Modaks */}
      <motion.div
        className="absolute top-[45%] left-[20%] md:left-[30%] w-10 md:w-14 h-auto opacity-80"
        animate={{ y: [-4, 4, -4], rotate: [-5, 5, -5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Modak className="w-full h-full drop-shadow-[0_4px_8px_rgba(46,30,18,0.2)]" />
      </motion.div>
      <motion.div
        className="absolute top-[42%] right-[25%] md:right-[32%] w-8 md:w-12 h-auto opacity-80"
        animate={{ y: [-3, 3, -3], rotate: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Modak className="w-full h-full drop-shadow-[0_4px_8px_rgba(46,30,18,0.2)]" />
      </motion.div>

      {/* Decorative Poster Product Cards (Natural Composition) */}
      {/* Movie Poster Left */}
      <motion.div
        className="absolute hidden md:block top-[20%] left-[10%] w-[120px] aspect-[2/3] bg-white rounded-xl p-1 shadow-xl -rotate-12"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [-5, 5, -5] }}
        transition={{ y: { duration: 7, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 1 }, scale: { duration: 1 } }}
      >
        <div className="w-full h-full bg-[#E5D5C5] rounded-lg overflow-hidden relative">
          <Image src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80" alt="Poster" fill className="object-cover opacity-80 mix-blend-multiply" />
        </div>
      </motion.div>

      {/* Music Poster Right */}
      <motion.div
        className="absolute hidden md:block top-[15%] right-[10%] w-[100px] aspect-square bg-white rounded-xl p-1 shadow-xl rotate-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [-4, 4, -4] }}
        transition={{ y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }, opacity: { duration: 1 }, scale: { duration: 1 } }}
      >
        <div className="w-full h-full bg-[#D9945B] rounded-lg overflow-hidden relative">
          <Image src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80" alt="Vinyl" fill className="object-cover opacity-90 mix-blend-multiply" />
        </div>
      </motion.div>
    </div>
  );
}
