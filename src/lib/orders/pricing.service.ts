import type { CartItem, OrderItem } from '@/types';

export interface PricingSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  grandTotal: number;
}

/**
 * Calculates the exact pricing for an order.
 * Ensures consistent calculation across checkout and admin.
 */
export function calculateOrderPricing(
  items: (CartItem | OrderItem)[],
  shippingCost: number = 0,
  discount: number = 0,
  taxRate: number = 0 // e.g., 0.18 for 18% GST
): PricingSummary {
  const subtotal = items.reduce((sum, item) => {
    // Both CartItem and OrderItem now use unit_price
    const price = item.unit_price;
    return sum + (price * item.quantity);
  }, 0);

  // If subtotal is greater than 1000, shipping might be free (business rule)
  // But we allow explicit override if passed
  const calculatedShipping = shippingCost > 0 ? shippingCost : (subtotal > 1000 ? 0 : 50);

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * taxRate;
  
  const grandTotal = subtotal + tax + calculatedShipping - discount;

  return {
    subtotal,
    tax,
    shipping: calculatedShipping,
    discount,
    grandTotal
  };
}

/**
 * Formats a number as INR currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
