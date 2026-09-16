'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackSrc,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-white/5 border border-white/10 text-white/30 p-2 text-center select-none", className)}>
        <ImageOff className="w-5 h-5 mb-1 opacity-50" />
        <span className="text-[10px] tracking-wider uppercase font-medium text-white/40">No Preview</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || 'Product image'}
      className={cn(
        'transition-opacity duration-300',
        !loaded && 'opacity-0',
        loaded && 'opacity-100',
        className
      )}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (fallbackSrc) {
          setError(false);
        } else {
          setError(true);
        }
      }}
      {...props}
    />
  );
}
