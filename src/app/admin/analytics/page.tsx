export const dynamic = 'force-dynamic';

import { getAnalyticsSummary, getDailySales, getTopProducts, getDeviceAnalytics } from '@/lib/analytics';
import { AdminAnalyticsView } from '@/components/admin/AdminAnalyticsView';

export default async function AdminAnalyticsPage() {
  const [summary, dailySales, topProducts, deviceAnalytics] = await Promise.all([
    getAnalyticsSummary(),
    getDailySales(30),
    getTopProducts(10),
    getDeviceAnalytics(),
  ]);

  return (
    <AdminAnalyticsView
      summary={summary}
      dailySales={dailySales}
      topProducts={topProducts}
      deviceAnalytics={deviceAnalytics}
    />
  );
}
