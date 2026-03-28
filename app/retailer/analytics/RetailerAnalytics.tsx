'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatCard } from '@/components/shared';
import { RevenueChart, TopItemsList, DonutChart, SalesBarChart } from '@/components/charts';
import { TrendingUp, ShoppingCart, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatCurrency, cn } from '@/utils';

export function RetailerAnalytics() {
  const [period, setPeriod] = useState(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['retailer-analytics-deep', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      return (await res.json()).data;
    },
  });

  const profitMargin = analytics?.totalRevenue > 0
    ? ((analytics.totalRevenue * 0.28) / analytics.totalRevenue * 100).toFixed(1)
    : '0';

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Sales performance, inventory turnover, and business intelligence"
        actions={
          <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="input-field py-2 w-36">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue" value={analytics?.totalRevenue || 0} prefix="$" change={analytics?.revenueGrowth} icon={<TrendingUp className="w-4 h-4" />} color="blue" loading={isLoading} />
        <StatCard label="Orders" value={analytics?.totalOrders || 0} change={analytics?.ordersGrowth} icon={<ShoppingCart className="w-4 h-4" />} color="green" loading={isLoading} />
        <StatCard label="Gross Margin" value={profitMargin} suffix="%" icon={<BarChart3 className="w-4 h-4" />} color="purple" loading={isLoading} />
        <StatCard label="Stock Alerts" value={analytics?.inventoryAlerts || 0} icon={<AlertTriangle className="w-4 h-4" />} color="orange" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Daily Revenue</h2>
          <p className="text-sm text-muted-foreground mb-6">Revenue trend over the selected period</p>
          <RevenueChart data={analytics?.revenueByDay || []} height={240} />
        </div>
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Order Status Mix</h2>
          <p className="text-sm text-muted-foreground mb-4">Current distribution</p>
          <DonutChart data={analytics?.ordersByStatus || []} height={220} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Top Selling Drugs</h2>
          <p className="text-sm text-muted-foreground mb-6">By revenue this period</p>
          <TopItemsList items={analytics?.topDrugs?.slice(0, 8) || []} />
        </div>

        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Symptom Trends</h2>
          <p className="text-sm text-muted-foreground mb-6">Most logged consumer symptoms in area</p>
          {analytics?.topSymptoms?.length > 0
            ? <SalesBarChart data={analytics.topSymptoms.slice(0, 8).map((s: any) => ({ label: s.label, value: s.value }))} height={240} />
            : <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No symptom data</div>
          }
        </div>
      </div>

      {/* Inventory health */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-6">Inventory Health Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total SKUs', value: analytics?.totalProducts || 0, color: 'bg-blue-500/10 text-blue-600', desc: 'Products tracked' },
            { label: 'Low Stock Items', value: analytics?.lowStockItems || 0, color: 'bg-yellow-500/10 text-yellow-600', desc: 'Below reorder level' },
            { label: 'Expiring Soon', value: analytics?.expiringSoon || 0, color: 'bg-orange-500/10 text-orange-600', desc: 'Within 90 days' },
          ].map(item => (
            <div key={item.label} className={cn('rounded-2xl p-5', item.color.replace('text-', 'border-') + '/20 border')}>
              <div className={cn('text-3xl font-display font-bold mb-1', item.color.split(' ')[1])}>{item.value}</div>
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
