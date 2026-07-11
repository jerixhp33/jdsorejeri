import { getInventoryAnalytics } from '@/lib/inventory-analytics';
import { InventoryAnalyticsView } from '@/components/admin/InventoryAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function InventoryAnalyticsPage() {
  const data = await getInventoryAnalytics();
  return <InventoryAnalyticsView data={data} />;
}
