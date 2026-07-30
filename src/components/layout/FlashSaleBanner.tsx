import { getActiveFlashSale } from '@/lib/flash-sales';
import { FlashSaleTimerClient } from './FlashSaleTimerClient';

export async function FlashSaleBanner() {
  const flashSale = await getActiveFlashSale();
  
  if (!flashSale) return null;

  return (
    <div className="bg-black/90 text-white backdrop-blur-md border-b border-white/10 relative z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-luxe-accent/10 via-purple-500/10 to-cyan-500/10 opacity-50" />
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm sm:text-base font-medium">
        <div className="flex items-center gap-2">
          <span className="text-luxe-accent">⚡</span>
          <span className="tracking-wide text-gray-100">{flashSale.title}</span>
          <span className="bg-white/10 px-2 py-0.5 rounded text-luxe-accent font-bold">
            {flashSale.discount_percentage}% OFF
          </span>
        </div>
        <FlashSaleTimerClient endAt={flashSale.end_at} />
      </div>
    </div>
  );
}
