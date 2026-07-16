'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
// @ts-ignore
import Persp from 'perspective-transform';

export default function ReadOnlyGallery({ layout }: { layout: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [warpMatrix, setWarpMatrix] = useState('none');
  const [scale, setScale] = useState(1);

  // Resize handler to fit screen
  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 768) {
        setScale(0.7);
      } else {
        setScale(1.2);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Perspective Matrix
  useEffect(() => {
    const corners = layout.wall_corners;
    if (!corners || !containerRef.current) {
      setWarpMatrix('none');
      return;
    }

    const { width, height } = containerRef.current.getBoundingClientRect();
    const src = [0, 0, width, 0, width, height, 0, height];
    const dst = corners.flatMap((c: any) => [c.x, c.y]);
    try {
      const transform = Persp(src, dst);
      const [a, b, c, d, e, f, g, h, i] = transform.coeffs;
      const matrix3d = `matrix3d(${a}, ${d}, 0, ${g}, ${b}, ${e}, 0, ${h}, 0, 0, 1, 0, ${c}, ${f}, 0, ${i})`;
      setWarpMatrix(matrix3d);
    } catch (e) {
      console.warn('Warp failed', e);
    }
  }, [layout.wall_corners]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black/90 pt-16">
      
      {/* Background Room Image */}
      <img 
        src={layout.room_theme_url} 
        alt="Room" 
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      
      {/* Lighting Gradient */}
      <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />

      {/* 3D Viewport */}
      <div 
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" 
        style={{ perspective: layout.wall_corners ? undefined : '1000px' }}
      >
        <div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out"
          style={{
            transform: warpMatrix !== 'none' ? warpMatrix : `scale(${scale})`,
            transformOrigin: '0 0',
            position: warpMatrix !== 'none' ? 'absolute' : 'relative',
            top: 0,
            left: 0
          }}
        >
          {layout.posters.map((poster: any) => (
            <div
              key={poster.id}
              className={cn(
                "absolute pointer-events-none rounded-[2px]",
                poster.frame.css
              )}
              style={{
                width: `${poster.scaleFactor * 100}%`,
                maxWidth: poster.isHero ? '400px' : '300px',
                aspectRatio: '3/4',
                top: `calc(50% + ${poster.yPercent}%)`,
                left: `calc(50% + ${poster.xPercent}%)`,
                transform: `translate(-50%, -50%) rotate(${poster.rotation}deg)`,
                backgroundColor: poster.frame.css.includes('bg-') ? undefined : '#1a1a1a',
                zIndex: poster.isHero ? 20 : 10,
                boxShadow: poster.isHero 
                  ? (layout.light_source === 'left' ? '20px 20px 45px rgba(0,0,0,0.8)' : layout.light_source === 'right' ? '-20px 20px 45px rgba(0,0,0,0.8)' : '0 20px 45px rgba(0,0,0,0.8)') 
                  : (layout.light_source === 'left' ? '12px 12px 30px rgba(0,0,0,0.6)' : layout.light_source === 'right' ? '-12px 12px 30px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.6)')
              }}
            >
              <img 
                src={poster.url} 
                alt={poster.productName} 
                className="w-full h-full object-cover shadow-inner pointer-events-none"
                crossOrigin="anonymous"
              />
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
