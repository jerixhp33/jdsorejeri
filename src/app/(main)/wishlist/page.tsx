import type { Metadata } from 'next';
import { WishlistView } from '@/components/wishlist/WishlistView';

export const metadata: Metadata = {
  title: 'My Wishlist',
};

// Client component - no static prerendering needed
export const dynamic = 'force-dynamic';

export default function WishlistPage() {
  return <WishlistView />;
}
