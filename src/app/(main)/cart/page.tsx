export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your cart and proceed to checkout',
};

export default function CartPage() {
  return <CartView />;
}
