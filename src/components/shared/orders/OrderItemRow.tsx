'use client';

import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import type { OrderItem } from '@/types';

interface Props {
  item: OrderItem;
  className?: string;
}

export function OrderItemRow({ item, className = '' }: Props) {
  const price = item.unit_price ?? 0;
  const total = price * (item.quantity ?? 1);
  const options = [];

  if ((item as any).selected_size) options.push(`Size: ${(item as any).selected_size}`);
  if ((item as any).selected_color) options.push(`Color: ${(item as any).selected_color}`);
  if ((item as any).selected_material) options.push(`Material: ${(item as any).selected_material}`);
  
  const pSize = (item as any).poster_size;
  if (pSize) {
    const sizeStr = typeof pSize === 'object' ? pSize.label : pSize;
    options.push(`Poster Size: ${sizeStr}`);
  }
  
  if ((item as any).poster_frame) options.push(`Frame: ${(item as any).poster_frame}`);
  if ((item as any).poster_finish) options.push(`Finish: ${(item as any).poster_finish}`);

  return (
    <div className={`flex gap-4 py-4 ${className}`}>
      {/* Product Image */}
      <div className="relative w-20 h-20 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0">
        {item.product?.images?.[0] ? (
          <Image
            src={item.product.images[0].url}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-foreground font-medium truncate">
          {item.product?.name || 'Unknown Product'}
        </h4>
        
        {options.length > 0 && (
          <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {options.map((opt, i) => (
              <span key={i}>{opt}</span>
            ))}
          </div>
        )}
      </div>

      {/* Price & Quantity */}
      <div className="text-right flex flex-col justify-center">
        <div className="text-foreground font-medium">{formatCurrency(total)}</div>
        <div className="text-sm text-zinc-400 mt-1">
          {item.quantity} × {formatCurrency(price)}
        </div>
      </div>
    </div>
  );
}
