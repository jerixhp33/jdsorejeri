export type FestivalType = 'diwali' | 'vinayagar_chaturthi';

export interface FestivalTheme {
  /** Background gradient classes (Tailwind) */
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
    gradientFrom: '#1a0605',
    gradientVia: '#2a0e10',
    radialGlow: 'rgba(220, 38, 38, 0.12)',
    navbarScrolledClasses: 'bg-[#1a0b0c]/70 backdrop-blur-2xl border border-amber-500/20 shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:bg-[#1a0b0c]/80 hover:border-amber-500/30',
    navbarUnscrolledClasses: 'bg-[#1a0b0c]/50 backdrop-blur-md border border-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.1)] hover:bg-[#1a0b0c]/60 hover:border-amber-500/20',
    marqueeClasses: 'bg-white/30 border-white/40 text-black shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
    marqueeText: 'text-black/90',
    sparkleColor: 'text-black/60',
    edgeLightClass: 'nav-edge-light--festival',
    particleColor: '#fcd34d',
    particleGlow: 'rgba(252, 211, 77, 0.8)',
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
