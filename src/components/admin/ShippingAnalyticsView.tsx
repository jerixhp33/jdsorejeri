'use client';

import {
  Truck, Clock, AlertCircle, RefreshCcw, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';

export function ShippingAnalyticsView({ data }: { data: any }) {
  const kpis = [
    { label: 'Avg Fulfillment Time', value: `${data.avgFulfillmentDays.toFixed(1)} Days`, icon: Clock, color: 'text-luxe-accent' },
    { label: 'Avg Delivery Time', value: `${data.avgDeliveryDays.toFixed(1)} Days`, icon: Truck, color: 'text-green-400' },
    { label: 'Return Rate', value: `${data.returnRate.toFixed(1)}%`, icon: RefreshCcw, color: 'text-amber-400' },
    { label: 'Failed Deliveries', value: data.failedDeliveries, icon: AlertCircle, color: 'text-red-400' },
    { label: 'Est. Shipping Cost', value: formatCurrency(data.shippingCostPerOrder) + '/order', icon: DollarSign, color: 'text-blue-400' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card p-5">
            <div className="flex justify-between items-start mb-3">
              <k.icon className={cn("w-5 h-5", k.color)} />
            </div>
            <p className="font-display text-lg lg:text-2xl font-bold text-white mb-1">{k.value}</p>
            <p className="text-white/50 text-[10px] lg:text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courier Performance Chart */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Truck className="w-4 h-4 text-white/50" />
            Courier Delivery Success
          </h2>
          {data.courierPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.courierPerformance} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend />
                <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#c8a96e" radius={[0, 4, 4, 0]} barSize={24} />
                <Bar dataKey="failed" name="Failed" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-white/40 text-sm">No courier shipment data available yet.</p>
          )}
        </div>

        {/* Courier Success Rates Table */}
        <div className="glass-card p-6">
           <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white/50" />
            Courier Performance Detail
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/40 text-xs border-b border-white/5">
                  <th className="pb-3 font-medium">Provider</th>
                  <th className="pb-3 font-medium text-right">Total Shipments</th>
                  <th className="pb-3 font-medium text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.courierPerformance.map((c: any) => (
                  <tr key={c.name}>
                    <td className="py-4 text-sm text-white capitalize">{c.name}</td>
                    <td className="py-4 text-sm text-white/70 text-right">{c.total}</td>
                    <td className="py-4 text-sm text-right">
                      <span className={cn("font-bold", c.successRate > 90 ? "text-emerald-400" : c.successRate > 75 ? "text-amber-400" : "text-red-400")}>
                        {c.successRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {data.courierPerformance.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-white/40 text-sm">No courier shipments made.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
