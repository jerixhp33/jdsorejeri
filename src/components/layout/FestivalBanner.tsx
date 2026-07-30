'use client';

import React, { useState } from 'react';
import { useFestival } from '@/components/providers/FestivalProvider';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlashSaleTimerClient } from '@/components/layout/FlashSaleTimerClient';

export function FestivalBanner() {
  const { activeFestival, optOut } = useFestival();
  const [copied, setCopied] = useState(false);

  if (!activeFestival || optOut) return null;

  const config = activeFestival.config;
  if (!config) return null;

  // We only show banner if there is text or a promo code or a sale pct
  if (!config.banner_text && !config.promo_code && !config.sale_pct) return null;

  const handleCopy = () => {
    if (config.promo_code) {
      navigator.clipboard.writeText(config.promo_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case 'diwali': return '🪔';
      case 'christmas': return '🎄';
      case 'newyear': return '✨';
      case 'pongal': return '🌾';
      case 'halloween': return '🎃';
      case 'eid': return '🌙';
      case 'valentines': return '💖';
      default: return '🎉';
    }
  };

  return (
    <div className="w-full bg-festival-primary text-festival-primary-foreground relative z-[60] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm font-medium">
          
          {/* Left: Name */}
          <div className="flex items-center gap-2">
            <span className="text-base">{getEmoji(activeFestival.theme_type)}</span>
            <span className="tracking-wide hidden sm:inline-block">{activeFestival.name}</span>
          </div>

          {/* Center: Text & Promo Code */}
          <div className="flex items-center gap-3 text-center">
            {config.sale_pct ? (
              <span>Up to {config.sale_pct}% Off</span>
            ) : (
              <span>{config.banner_text}</span>
            )}
            
            {config.promo_code && (
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all",
                  "bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm",
                  copied && "bg-green-500/80"
                )}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {config.promo_code}
              </button>
            )}
          </div>

          {/* Right: Countdown */}
          <div className="flex items-center gap-2 text-xs opacity-90">
             <span className="hidden lg:inline">Ends in:</span>
             <FlashSaleTimerClient endTime={activeFestival.end_at} />
          </div>

        </div>
      </div>
    </div>
  );
}
