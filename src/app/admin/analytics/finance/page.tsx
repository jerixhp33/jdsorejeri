import { getFinanceAnalytics, getProductPerformanceMatrix } from '@/lib/finance-analytics';
import { FinanceAnalyticsView } from '@/components/admin/FinanceAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function FinanceAnalyticsPage() {
  const data = await getFinanceAnalytics(30); // Last 30 days
  const matrix = await getProductPerformanceMatrix(30);
  return <FinanceAnalyticsView data={data} matrix={matrix} />;
}
