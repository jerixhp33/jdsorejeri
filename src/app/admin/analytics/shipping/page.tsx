import { getShippingAnalytics } from '@/lib/shipping-analytics';
import { ShippingAnalyticsView } from '@/components/admin/ShippingAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function ShippingAnalyticsPage() {
  const data = await getShippingAnalytics();
  return <ShippingAnalyticsView data={data} />;
}
