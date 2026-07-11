import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types';

interface Props {
  order: Partial<Order>;
  className?: string;
}

export function PriceSummary({ order, className = '' }: Props) {
  const shipping = order.shipping_cost ?? order.delivery_charge ?? 0;
  const tax = order.tax ?? 0;
  const discount = order.discount_amount ?? 0;
  
  // Calculate items total as fallback
  const itemsTotal = (order.items || []).reduce((sum: number, item: any) => {
    return sum + ((item.unit_price || 0) * (item.quantity || 1));
  }, 0);

  let grandTotal = order.grand_total ?? order.total ?? 0;
  let subtotal = 0;

  if (grandTotal > 0) {
    // If we have a stored grand total, reverse-engineer the subtotal
    subtotal = grandTotal - tax - shipping + discount;
  } else {
    // Fallback: calculate from items
    subtotal = itemsTotal;
    grandTotal = subtotal + tax + shipping - discount;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between text-sm text-zinc-400">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-400">
          <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm text-zinc-400">
        <span>Shipping</span>
        <span>
          {shipping === 0 ? (
            <span className="text-green-400">Free</span>
          ) : (
            formatCurrency(shipping)
          )}
        </span>
      </div>

      {tax > 0 && (
        <div className="flex justify-between text-sm text-zinc-400">
          <span>Estimated Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
      )}

      <div className="pt-3 border-t border-zinc-800 flex justify-between font-medium text-white">
        <span>Total</span>
        <span className="text-luxe-accent">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
