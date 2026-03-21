'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatCard, AlertBanner, Spinner } from '@/components/shared';
import { RevenueChart, TopItemsList, DonutChart, SalesBarChart } from '@/components/charts';
import { BarChart3, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/utils';
import toast from 'react-hot-toast';

export function WholesalerAnalytics() {
  const [period, setPeriod] = useState(30);
  const [forecast, setForecast] = useState<any[]>([]);
  const [forecasting, setForecasting] = useState(false);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      const d = await res.json();
      return d.data;
    },
  });

  const runForecast = async () => {
    setForecasting(true);
    try {
      const res = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomTrends: analytics?.topSymptoms?.map((s: any) => ({ symptom: s.label, count: s.value, date: new Date().toISOString() })) || [],
          currentInventory: analytics?.topDrugs?.map((d: any) => ({ drug: d.name, quantity: d.quantity || 100 })) || [],
        }),
      });
      const data = await res.json();
      if (data.success) { setForecast(data.data); toast.success('Forecast generated!'); }
      else toast.error('Forecast failed');
    } catch { toast.error('Network error'); }
    finally { setForecasting(false); }
  };

  return (
    <div>
      <PageHeader
        title="Analytics & Intelligence"
        subtitle="Data-driven insights powered by AI demand forecasting"
        actions={
          <div className="flex gap-3">
            <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="input-field py-2 w-36">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={runForecast} disabled={forecasting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {forecasting ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
              AI Demand Forecast
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={analytics?.totalRevenue || 0} prefix="$" change={analytics?.revenueGrowth} icon={<TrendingUp className="w-4 h-4" />} color="blue" loading={isLoading} />
        <StatCard label="Total Orders" value={analytics?.totalOrders || 0} change={analytics?.ordersGrowth} icon={<BarChart3 className="w-4 h-4" />} color="green" loading={isLoading} />
        <StatCard label="Inventory Alerts" value={analytics?.inventoryAlerts || 0} icon={<AlertTriangle className="w-4 h-4" />} color="orange" loading={isLoading} />
        <StatCard label="Low Stock Items" value={analytics?.lowStockItems || 0} icon={<AlertTriangle className="w-4 h-4" />} color="red" loading={isLoading} />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Revenue & Orders Over Time</h2>
          <p className="text-sm text-muted-foreground mb-6">Blue = revenue, Green = order count</p>
          <RevenueChart data={analytics?.revenueByDay || []} height={260} />
        </div>
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Orders by Status</h2>
          <p className="text-sm text-muted-foreground mb-4">Current pipeline</p>
          <DonutChart data={analytics?.ordersByStatus || []} height={220} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Top Products by Revenue</h2>
          <p className="text-sm text-muted-foreground mb-6">Best-selling drugs this period</p>
          <TopItemsList items={analytics?.topDrugs?.slice(0, 8) || []} />
        </div>

        {analytics?.topSymptoms?.length > 0 && (
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-1">Top Consumer Symptoms</h2>
            <p className="text-sm text-muted-foreground mb-6">Platform-wide symptom frequency</p>
            <SalesBarChart data={analytics.topSymptoms.slice(0, 8).map((s: any) => ({ label: s.label, value: s.value }))} height={240} />
          </div>
        )}
      </div>

      {/* AI Demand Forecast */}
      {forecast.length > 0 && (
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pharma-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pharma-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">AI Demand Forecast</h2>
              <p className="text-sm text-muted-foreground">Predicted demand based on symptom trends</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {forecast.map((item, i) => (
              <div key={i} className={cn('rounded-2xl border p-4',
                item.urgency === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/40' :
                item.urgency === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/40' :
                'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/40'
              )}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{item.drug}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ml-2',
                    item.urgency === 'high' ? 'bg-red-100 text-red-700' :
                    item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {item.urgency}
                  </span>
                </div>
                <div className="text-2xl font-display font-bold mb-1">{item.predictedDemand?.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mb-3">predicted units needed</div>
                <div className="text-xs text-foreground bg-background/60 rounded-xl p-2.5">{item.restockRecommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
