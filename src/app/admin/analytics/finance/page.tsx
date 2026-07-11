import { getFinanceAnalytics } from '@/lib/finance-analytics';
import { FinanceAnalyticsView } from '@/components/admin/FinanceAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function FinanceAnalyticsPage() {
  const data = await getFinanceAnalytics(30); // Last 30 days
  return <FinanceAnalyticsView data={data} />;
}
