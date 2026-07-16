export interface RoomTheme {
  name: string;
  url: string;
  lighting: string; // Gradient overlay for ambient lighting
}

export const ROOM_THEMES: RoomTheme[] = [
  { name: 'Modern White', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/40 via-transparent to-white/10' },
  { name: 'Concrete Loft', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/70 via-black/10 to-transparent' },
  { name: 'Scandinavian', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/30 via-transparent to-white/20' },
  { name: 'Luxury Beige', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80', lighting: 'from-[#3a322c]/50 via-transparent to-[#fff5eb]/10' },
  { name: 'Dark Gallery', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/90 via-black/40 to-black/10' },
  { name: 'Minimal Grey', url: 'https://images.unsplash.com/photo-1598928506311-c55dd1b8e8f8?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/60 via-transparent to-white/5' },
  { name: 'Japandi', url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=80', lighting: 'from-[#4a4238]/40 via-transparent to-[#f5f0e6]/20' },
  { name: 'Industrial', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/80 via-black/20 to-transparent' },
  { name: 'Warm Living Room', url: 'https://images.unsplash.com/photo-1583847268964-b28ce8f52859?auto=format&fit=crop&w=1600&q=80', lighting: 'from-[#523a28]/60 via-transparent to-[#ffecd2]/10' },
  { name: 'Studio Apartment', url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1600&q=80', lighting: 'from-black/50 via-transparent to-white/10' },
];

export interface FrameStyle {
  id: string;
  name: string;
  css: string;
}

export const FRAME_STYLES: FrameStyle[] = [
  { id: 'frameless', name: 'Frameless', css: 'border-none' },
  { id: 'minimal-black', name: 'Minimal Black', css: 'border-[4px] border-[#1a1a1a] bg-[#1a1a1a]' },
  { id: 'minimal-white', name: 'Minimal White', css: 'border-[4px] border-[#f5f5f5] bg-[#f5f5f5]' },
  { id: 'natural-oak', name: 'Natural Oak', css: 'border-[8px] border-[#c19a6b] bg-[#c19a6b] shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' },
  { id: 'dark-walnut', name: 'Dark Walnut', css: 'border-[10px] border-[#4a3018] bg-[#4a3018] shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]' },
  { id: 'matte-metal', name: 'Matte Metal', css: 'border-[3px] border-[#7a7a7a] bg-[#7a7a7a] shadow-[inset_0_0_5px_rgba(255,255,255,0.3)]' },
];

export interface PosterPosition {
  isHero: boolean;
  xPercent: number; // Offset from center X
  yPercent: number; // Offset from center Y
  scaleFactor: number; // Relative scale. Hero is usually 1.
}

export interface GalleryPreset {
  id: string;
  name: string;
  posters: PosterPosition[];
}

// X and Y are percentages of the container's width/height from the exact center.
export const GALLERY_PRESETS: GalleryPreset[] = [
  {
    id: 'editorial-left',
    name: 'Editorial Left',
    posters: [
      { isHero: true, xPercent: -15, yPercent: 0, scaleFactor: 1.0 },
      { isHero: false, xPercent: 20, yPercent: -15, scaleFactor: 0.55 },
      { isHero: false, xPercent: 22, yPercent: 20, scaleFactor: 0.65 },
    ]
  },
  {
    id: 'editorial-right',
    name: 'Editorial Right',
    posters: [
      { isHero: true, xPercent: 15, yPercent: 0, scaleFactor: 1.0 },
      { isHero: false, xPercent: -20, yPercent: -20, scaleFactor: 0.6 },
      { isHero: false, xPercent: -18, yPercent: 20, scaleFactor: 0.5 },
    ]
  },
  {
    id: 'museum-trio',
    name: 'Museum Trio',
    posters: [
      { isHero: true, xPercent: 0, yPercent: 0, scaleFactor: 1.0 },
      { isHero: false, xPercent: -28, yPercent: 0, scaleFactor: 0.7 },
      { isHero: false, xPercent: 28, yPercent: 0, scaleFactor: 0.7 },
    ]
  },
  {
    id: 'scandinavian-duo',
    name: 'Scandinavian Duo',
    posters: [
      { isHero: true, xPercent: -10, yPercent: 0, scaleFactor: 1.0 },
      { isHero: false, xPercent: 20, yPercent: 10, scaleFactor: 0.65 },
    ]
  },
  {
    id: 'floating-corner',
    name: 'Floating Corner',
    posters: [
      { isHero: true, xPercent: -18, yPercent: -10, scaleFactor: 1.0 },
      { isHero: false, xPercent: 12, yPercent: 5, scaleFactor: 0.6 },
      { isHero: false, xPercent: 25, yPercent: 25, scaleFactor: 0.45 },
    ]
  },
  {
    id: 'modern-offset',
    name: 'Modern Offset',
    posters: [
      { isHero: true, xPercent: -5, yPercent: 10, scaleFactor: 1.0 },
      { isHero: false, xPercent: -15, yPercent: -25, scaleFactor: 0.5 },
      { isHero: false, xPercent: 20, yPercent: -10, scaleFactor: 0.7 },
    ]
  },
  {
    id: 'vogue-layout',
    name: 'Vogue Layout',
    posters: [
      { isHero: true, xPercent: 0, yPercent: -10, scaleFactor: 1.0 },
      { isHero: false, xPercent: 22, yPercent: 15, scaleFactor: 0.6 },
      { isHero: false, xPercent: -18, yPercent: 20, scaleFactor: 0.4 },
    ]
  },
  {
    id: 'luxury-living',
    name: 'Luxury Living',
    posters: [
      { isHero: true, xPercent: -15, yPercent: -5, scaleFactor: 1.2 }, // Oversized
      { isHero: false, xPercent: 18, yPercent: 5, scaleFactor: 0.5 },
      { isHero: false, xPercent: 25, yPercent: 25, scaleFactor: 0.4 },
    ]
  },
  {
    id: 'japandi',
    name: 'Japandi',
    posters: [
      { isHero: true, xPercent: -12, yPercent: 0, scaleFactor: 0.9 },
      { isHero: false, xPercent: 20, yPercent: 15, scaleFactor: 0.5 },
    ]
  },
  {
    id: 'collector-wall',
    name: 'Collector Wall',
    posters: [
      { isHero: true, xPercent: -15, yPercent: -15, scaleFactor: 1.0 },
      { isHero: false, xPercent: 15, yPercent: -20, scaleFactor: 0.5 },
      { isHero: false, xPercent: 10, yPercent: 20, scaleFactor: 0.6 },
      { isHero: false, xPercent: -10, yPercent: 25, scaleFactor: 0.45 }, // 4 posters for collector!
    ]
  },
  {
    id: 'balanced-trio',
    name: 'Balanced Trio',
    posters: [
      { isHero: true, xPercent: 0, yPercent: 0, scaleFactor: 1.0 },
      { isHero: false, xPercent: -22, yPercent: -15, scaleFactor: 0.5 },
      { isHero: false, xPercent: 22, yPercent: 15, scaleFactor: 0.5 },
    ]
  },
  {
    id: 'gallery-feature',
    name: 'Gallery Feature',
    posters: [
      { isHero: true, xPercent: -5, yPercent: 0, scaleFactor: 1.1 },
      { isHero: false, xPercent: 25, yPercent: -15, scaleFactor: 0.4 },
      { isHero: false, xPercent: 20, yPercent: 20, scaleFactor: 0.5 },
    ]
  }
];
