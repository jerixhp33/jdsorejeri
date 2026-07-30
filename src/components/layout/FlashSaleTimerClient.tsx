'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FlashSaleTimerClient({ endAt }: { endAt: string }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    hours: '00',
    minutes: '00',
    seconds: '00',
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(endAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        // Refresh the page when the sale ends to remove the banner and reset prices
        router.refresh();
        return;
      }

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endAt, router]);

  if (isExpired) return null;

  return (
    <div className="flex items-center gap-1.5 text-gray-300">
      <Clock className="w-4 h-4" />
      <span>ENDS IN:</span>
      <div className="flex items-center gap-1 font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">
        <span>{timeLeft.hours}</span>
        <span className="text-white/50">:</span>
        <span>{timeLeft.minutes}</span>
        <span className="text-white/50">:</span>
        <span className="text-luxe-accent/80">{timeLeft.seconds}</span>
      </div>
    </div>
  );
}
