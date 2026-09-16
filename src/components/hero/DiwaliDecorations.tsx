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

      {/* Traditional Toran Header Garland — Dedicated Slot ABOVE Hero Banner */}
      <div className="absolute top-[75px] sm:top-[85px] md:top-[95px] left-0 right-0 z-20">
        <ToranGarland />
      </div>

      {/* Traditional Hanging Akash Kandil Lanterns (Outer Margins) */}
      <div className="absolute top-[85px] sm:top-[95px] md:top-[105px] left-[1%] sm:left-[2%] md:left-[3%] w-9 sm:w-14 md:w-20 h-auto z-10 opacity-90 will-change-transform">
        <AkashKandil id="kandil-l" className="w-full h-full drop-shadow-[0_8px_16px_rgba(245,158,11,0.3)]" />
      </div>
      <div className="absolute top-[85px] sm:top-[95px] md:top-[105px] right-[1%] sm:right-[2%] md:right-[3%] w-9 sm:w-14 md:w-20 h-auto z-10 opacity-90 will-change-transform">
        <AkashKandil id="kandil-r" className="w-full h-full drop-shadow-[0_8px_16px_rgba(245,158,11,0.3)]" />
      </div>

      {/* Large Background Rangoli — Centered via style (not Tailwind translate which Framer overrides) */}
      <motion.div 
        className="absolute top-[170px] sm:top-[190px] md:top-[220px] w-[340px] sm:w-[700px] md:w-[980px] opacity-45 will-change-transform transform-gpu z-0"
        style={{ left: '50%', x: '-50%' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <SolidDiwaliRangoli id="rangoli-main" className="w-full h-full" />
      </motion.div>

      {/* Main Brass Diya Focal Point — Centered via style */}
      <motion.div
        className="absolute top-[210px] sm:top-[230px] md:top-[260px] w-[160px] sm:w-[240px] md:w-[320px] opacity-95 drop-shadow-[0_15px_30px_rgba(120,53,15,0.3)] z-10 will-change-transform transform-gpu"
        style={{ left: '50%', x: '-50%' }}
        animate={{ y: [-6, 6, -6], scale: [1, 1.02, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya id="diya-main" className="w-full h-full" />
      </motion.div>

      {/* Marigold Base Garland around Central Diya */}
      <div 
        className="absolute top-[370px] sm:top-[420px] md:top-[480px] w-[220px] sm:w-[320px] md:w-[420px] flex justify-between opacity-90 z-10"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        <Marigold className="w-8 sm:w-14 md:w-[72px] h-8 sm:h-14 md:h-[72px] -ml-3 mt-4 sm:mt-6 drop-shadow-md" />
        <Marigold className="w-12 sm:w-[72px] md:w-[88px] h-12 sm:h-[72px] md:h-[88px] drop-shadow-lg" />
        <Marigold className="w-8 sm:w-14 md:w-[72px] h-8 sm:h-14 md:h-[72px] -mr-3 mt-4 sm:mt-6 drop-shadow-md" />
      </div>

      {/* Side Brass Diyas - Floating Left & Right */}
      <motion.div
        className="absolute top-[380px] sm:top-[430px] md:top-[500px] left-[4%] sm:left-[14%] md:left-[22%] w-8 sm:w-14 md:w-20 h-auto opacity-85 z-10 will-change-transform"
        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SolidDiya id="diya-left" className="w-full h-full drop-shadow-lg" />
      </motion.div>
      <motion.div
        className="absolute top-[370px] sm:top-[420px] md:top-[490px] right-[4%] sm:right-[14%] md:right-[22%] w-7 sm:w-12 md:w-[72px] h-auto opacity-85 z-10 will-change-transform"
        animate={{ y: [-4, 4, -4], rotate: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <SolidDiya id="diya-right" className="w-full h-full drop-shadow-lg" />
      </motion.div>

      {/* Floating Lotus Flowers - Bottom Corners */}
      <motion.div
        className="absolute bottom-[6%] left-[2%] w-12 sm:w-16 md:w-24 h-auto opacity-80 z-10 will-change-transform"
        animate={{ y: [-4, 4, -4], rotate: [-6, 6, -6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FloatingLotus id="lotus-l" className="w-full h-full drop-shadow-md" />
      </motion.div>
      <motion.div
        className="absolute bottom-[5%] right-[2%] w-12 sm:w-16 md:w-24 h-auto opacity-80 z-10 will-change-transform"
        animate={{ y: [-5, 5, -5], rotate: [6, -6, 6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <FloatingLotus id="lotus-r" className="w-full h-full drop-shadow-md" />
      </motion.div>
    </div>
  );
}
