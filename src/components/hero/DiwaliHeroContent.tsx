'use client';

import Link from 'next/link';

interface Config {
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  offer: string;
}

export function DiwaliHeroContent({ config }: { config: Config }) {
  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
      
      {/* Badge */}
      <div className="mb-6 px-4 py-1.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 backdrop-blur-sm">
        <span className="text-[#f59e0b] text-xs font-bold tracking-widest">{config.badge}</span>
      </div>

      {/* Heading */}
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
        Light Up Your <br className="hidden lg:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fcd34d] via-[#f59e0b] to-[#dc2626]">
          Walls This Diwali
        </span>
      </h1>

      {/* Description */}
      <p className="text-white/70 text-base sm:text-lg lg:text-xl max-w-lg mb-8 font-light leading-relaxed">
        {config.description}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center lg:justify-start mb-6">
        <Link 
          href="/products" 
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] text-center"
        >
          {config.primaryCta}
        </Link>
        <Link 
          href="/products?category=posters" 
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all text-center"
        >
          {config.secondaryCta}
        </Link>
      </div>

      {/* Offer */}
      <p className="text-[#fcd34d]/80 text-xs sm:text-sm font-medium tracking-wide">
        {config.offer}
      </p>

    </div>
  );
}
