export type FestivalType = 'diwali' | 'vinayagar_chaturthi';

export interface FestivalTheme {
  /** Background gradient hex color (used in inline CSS linear-gradient) */
  gradientFrom: string;
  gradientVia: string;
  /** Radial glow color for the ambient center */
  radialGlow: string;
  /** Navbar pill classes */
  navbarScrolledClasses: string;
  navbarUnscrolledClasses: string;
  /** Marquee strip wrapper classes */
  marqueeClasses: string;
  /** Marquee text class */
  marqueeText: string;
  /** Sparkle icon color */
  sparkleColor: string;
  /** CSS class for nav edge light animation */
  edgeLightClass: string;
  /** Particle spark hex color */
  particleColor: string;
  /** Particle glow shadow color */
  particleGlow: string;
}

export const FESTIVAL_THEMES: Record<FestivalType, FestivalTheme> = {
  diwali: {
    gradientFrom: '#FFF8F0',
    gradientVia: '#FFF3E6',
    radialGlow: 'rgba(217, 119, 6, 0.08)',
    navbarScrolledClasses: 'bg-[#2C1810]/90 backdrop-blur-2xl border border-[#D97706]/30 shadow-[0_8px_32px_rgba(217,119,6,0.18)] hover:bg-[#2C1810]/95 hover:border-[#D97706]/40',
    navbarUnscrolledClasses: 'bg-[#2C1810]/65 backdrop-blur-md border border-[#D97706]/20 shadow-[0_4px_20px_rgba(217,119,6,0.12)] hover:bg-[#2C1810]/80 hover:border-[#D97706]/30',
    marqueeClasses: 'bg-white/30 border-white/40 text-black shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
    marqueeText: 'text-black/90',
    sparkleColor: 'text-black/60',
    edgeLightClass: 'nav-edge-light--festival',
    particleColor: '#F59E0B',
    particleGlow: 'rgba(245, 158, 11, 0.4)',
  },
  vinayagar_chaturthi: {
    gradientFrom: '#FDFBF7',
    gradientVia: '#FDFBF7',
    radialGlow: 'rgba(217, 148, 91, 0.05)',
    navbarScrolledClasses: 'bg-[#2E1E12]/80 backdrop-blur-2xl border border-[#D9945B]/30 shadow-[0_8px_32px_rgba(217,148,91,0.15)] hover:bg-[#2E1E12]/90 hover:border-[#D9945B]/40',
    navbarUnscrolledClasses: 'bg-[#2E1E12]/50 backdrop-blur-md border border-[#D9945B]/20 shadow-[0_4px_20px_rgba(217,148,91,0.1)] hover:bg-[#2E1E12]/70 hover:border-[#D9945B]/30',
    marqueeClasses: 'bg-white/30 border-white/40 text-black shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
    marqueeText: 'text-black/90',
    sparkleColor: 'text-black/60',
    edgeLightClass: 'nav-edge-light--vinayagar',
    particleColor: '#D9945B',
    particleGlow: 'rgba(217, 148, 91, 0.4)',
  },
};

/** Get festival config, falling back to diwali */
export function getFestivalTheme(type?: string | null): FestivalTheme {
  if (type && type in FESTIVAL_THEMES) {
    return FESTIVAL_THEMES[type as FestivalType];
  }
  return FESTIVAL_THEMES.diwali;
}
