import { FestivalThemeType } from './types';

export interface AmbientConfig {
  particleType: 'sparkle' | 'snow' | 'burst' | 'firefly' | 'fog';
  gradients: [string, string, string];
  glowColor: string;
  baseCount: number;
}

export const FESTIVAL_CONFIGS: Record<FestivalThemeType, AmbientConfig> = {
  diwali: { 
    particleType: 'sparkle', 
    gradients: ['rgba(255,85,0,0.15)', 'rgba(255,0,85,0.05)', 'transparent'], 
    glowColor: '255,138,61', 
    baseCount: 70 
  },
  christmas: { 
    particleType: 'snow',    
    gradients: ['rgba(224,247,250,0.15)', 'rgba(255,255,255,0.05)', 'transparent'], 
    glowColor: '255,255,255', 
    baseCount: 80 
  },
  newyear: { 
    particleType: 'burst',   
    gradients: ['rgba(255,215,0,0.15)', 'rgba(0,0,128,0.05)', 'transparent'], 
    glowColor: '255,215,0', 
    baseCount: 60 
  },
  pongal: { 
    particleType: 'firefly', 
    gradients: ['rgba(249,168,37,0.15)', 'rgba(46,125,50,0.05)', 'transparent'], 
    glowColor: '249,168,37', 
    baseCount: 50 
  },
  halloween: { 
    particleType: 'fog',     
    gradients: ['rgba(138,43,226,0.15)', 'rgba(75,0,130,0.05)', 'transparent'], 
    glowColor: '138,43,226', 
    baseCount: 40 
  },
  eid: { 
    particleType: 'sparkle', 
    gradients: ['rgba(46,204,113,0.15)', 'rgba(241,196,15,0.05)', 'transparent'], 
    glowColor: '255,215,0', 
    baseCount: 55 
  },
  valentines: {
    particleType: 'sparkle',
    gradients: ['rgba(245,0,87,0.15)', 'rgba(255,64,129,0.05)', 'transparent'],
    glowColor: '245,0,87',
    baseCount: 70
  }
};
