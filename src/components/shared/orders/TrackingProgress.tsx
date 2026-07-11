import { getLifecycleProgress, isActiveStatus } from '@/lib/orders';
import type { OrderStatus } from '@/types';

interface Props {
  status: OrderStatus;
  className?: string;
}

export function TrackingProgress({ status, className = '' }: Props) {
  const progress = getLifecycleProgress(status);
  const isActive = isActiveStatus(status);
  const isTerminal = ['cancelled', 'returned', 'refunded'].includes(status);
  
  // If it's cancelled, we don't show the tracking bar as active
  if (!isActive && !isTerminal && status !== 'delivered') return null;

  let progressColor = 'bg-luxe-accent';
  if (status === 'delivered') progressColor = 'bg-green-500';
  if (status === 'cancelled') progressColor = 'bg-red-500';
  
  // For terminal non-delivered states, we might show full bar but red
  const displayProgress = isTerminal && status !== 'returned' && status !== 'refunded' ? 100 : progress;

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-in-out ${progressColor}`}
          style={{ width: `${Math.max(5, displayProgress)}%` }}
        />
      </div>
      
      {/* Visual stops along the way */}
      {!isTerminal && (
        <div className="flex justify-between mt-2 px-1">
          <div className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Placed</div>
          <div className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Shipped</div>
          <div className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Delivered</div>
        </div>
      )}
    </div>
  );
}
