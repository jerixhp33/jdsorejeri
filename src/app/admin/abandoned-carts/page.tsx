import { AbandonedCartsView } from '@/components/admin/AbandonedCartsView';

export const metadata = {
  title: 'Abandoned Carts | JD Store Admin',
};

export default function AbandonedCartsPage() {
  return (
    <div className="p-8">
      <AbandonedCartsView />
    </div>
  );
}
