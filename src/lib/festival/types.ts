export const FESTIVAL_THEME_TYPES = [
  'diwali', 'christmas', 'pongal',
  'halloween', 'eid', 'newyear', 'valentines'
] as const;

export type FestivalThemeType = typeof FESTIVAL_THEME_TYPES[number];

export interface FestivalConfig {
  banner_text?: string;
  badge_label?: string;
  particle_intensity?: 'low' | 'medium' | 'high';
  disable_particles?: boolean;
  promo_code?: string;
  sale_pct?: number;
}
