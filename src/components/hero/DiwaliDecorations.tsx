'use client';

import { motion } from 'framer-motion';
import { SolidDiya } from './SolidDiya';
import { SolidDiwaliRangoli } from './SolidDiwaliRangoli';
import { Marigold } from './Marigold';
import { PetalParticles } from './PetalParticles';
import { ToranGarland } from './ToranGarland';
import { FloatingLotus } from './FloatingLotus';
import { AkashKandil } from './AkashKandil';
import { DiwaliSparklers } from './DiwaliSparklers';
import Image from 'next/image';

export function DiwaliDecorations() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Sparkler Embers & Floating Flower Petals */}
      <DiwaliSparklers />
      <PetalParticles />

      {/* Traditional Toran Header Garland — Positioned Gracefully BELOW Navbar & Marquee */}
      <div className="absolute top-[115px] sm:top-[135px] md:top-[155px] left-0 right-0 z-20">
        <ToranGarland />
      </div>

      {/* Traditional Hanging Akash Kandil Lanterns (Left & Right Below Marquee) */}
      <div className="absolute top-[135px] sm:top-[155px] md:top-[175px] left-[3%] sm:left-[8%] md:left-[12%] w-10 sm:w-16 md:w-24 h-auto z-10 opacity-90">
        <AkashKandil className="w-full h-full drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]" />
      </div>

      <div className="absolute top-[135px] sm:top-[155px] md:top-[175px] right-[3%] sm:right-[8%] md:right-[12%] w-10 sm:w-16 md:w-24 h-auto z-10 opacity-90">
        <AkashKandil className="w-full h-full drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]" />
      </div>

      {/* Large Background Rangoli - Positioned Cleanly UNDER Marquee */}
      <motion.div 
        className="absolute top-[170px] sm:top-[190px] md:top-[220px] left-1/2 -translate-x-1/2 w-[340px] xs:w-[460px] sm:w-[700px] md:w-[980px] opacity-45 will-change-transform z-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <SolidDiwaliRangoli className="w-full h-full" />
      </motion.div>

      {/* Main Brass Diya Focal Point with Flickering Flame */}
      <motion.div
        className="absolute top-[210px] sm:top-[230px] md:top-[260px] left-1/2 -translate-x-1/2 w-[160px] xs:w-[200px] sm:w-[260px] md:w-[330px] opacity-95 drop-shadow-[0_15px_30px_rgba(120,53,15,0.4)] z-10"
        animate={{ y: [-6, 6, -6], scale: [1, 1.02, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya className="w-full h-full" />
      </motion.div>

      {/* Marigold Base Garland around Central Diya */}
      <div className="absolute top-[370px] sm:top-[420px] md:top-[480px] left-1/2 -translate-x-1/2 w-[220px] xs:w-[260px] sm:w-[320px] md:w-[420px] flex justify-between opacity-90 z-10">
        <Marigold className="w-8 xs:w-10 sm:w-14 md:w-18 h-8 xs:h-10 sm:h-14 md:h-18 -ml-3 mt-4 sm:mt-6 drop-shadow-md" />
        <Marigold className="w-12 xs:w-14 sm:w-18 md:w-22 h-12 xs:h-14 sm:h-18 md:h-22 drop-shadow-lg" />
        <Marigold className="w-8 xs:w-10 sm:w-14 md:w-18 h-8 xs:h-10 sm:h-14 md:h-18 -mr-3 mt-4 sm:mt-6 drop-shadow-md" />
      </div>

      {/* Side Brass Diyas - Floating Left & Right */}
      <motion.div
        className="absolute top-[380px] sm:top-[430px] md:top-[500px] left-[4%] xs:left-[8%] sm:left-[14%] md:left-[22%] w-8 xs:w-10 sm:w-14 md:w-20 h-auto opacity-85 z-10"
        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya className="w-full h-full drop-shadow-lg" />
      </motion.div>

      <motion.div
        className="absolute top-[370px] sm:top-[420px] md:top-[490px] right-[4%] xs:right-[8%] sm:right-[14%] md:right-[22%] w-7 xs:w-9 sm:w-12 md:w-18 h-auto opacity-85 z-10"
        animate={{ y: [-4, 4, -4], rotate: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <SolidDiya className="w-full h-full drop-shadow-lg" />
      </motion.div>

      {/* Floating Lotus Flowers - Bottom Corners */}
      <motion.div
        className="absolute bottom-[6%] left-[2%] xs:left-[4%] w-12 xs:w-16 md:w-24 h-auto opacity-80 z-10"
        animate={{ y: [-4, 4, -4], rotate: [-6, 6, -6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FloatingLotus className="w-full h-full drop-shadow-md" />
      </motion.div>

      <motion.div
        className="absolute bottom-[5%] right-[2%] xs:right-[4%] w-12 xs:w-16 md:w-24 h-auto opacity-80 z-10"
        animate={{ y: [-5, 5, -5], rotate: [6, -6, 6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <FloatingLotus className="w-full h-full drop-shadow-md" />
      </motion.div>

      {/* Decorative Poster Product Cards (Framing Below Marquee) */}
      {/* Movie Poster Left */}
      <motion.div
        className="absolute top-[260px] sm:top-[290px] md:top-[330px] left-[2%] xs:left-[4%] sm:left-[8%] md:left-[10%] w-[65px] xs:w-[80px] sm:w-[100px] md:w-[120px] aspect-[2/3] bg-white rounded-xl p-1 shadow-xl -rotate-12 opacity-80 sm:opacity-100 z-10"
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
        className="absolute top-[240px] sm:top-[270px] md:top-[310px] right-[2%] xs:right-[4%] sm:right-[8%] md:right-[10%] w-[60px] xs:w-[75px] sm:w-[90px] md:w-[105px] aspect-square bg-white rounded-xl p-1 shadow-xl rotate-6 opacity-80 sm:opacity-100 z-10"
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
