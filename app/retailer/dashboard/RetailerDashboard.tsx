'use client'

import { PageHeader, StatCard, AlertBanner } from '@/components/shared';
import { RevenueChart, DonutChart, TopItemsList } from '@/components/charts';
import { ShoppingCart, Package, AlertTriangle, TrendingUp, Users, Pill, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, timeAgo, cn } from '@/utils';
import Link from 'next/link';

export function RetailerDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['retailer-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics?period=30');
      const d = await res.json();
      return d.data;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['retailer-recent-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders?limit=6');
      const d = await res.json();
      return d.data || [];
    },
    refetchInterval: 60000,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const res = await fetch('/api/inventory?lowStock=true&limit=5');
      const d = await res.json();
      return d.data || [];
    },
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <PageHeader
        title="Pharmacy Dashboard"
        subtitle={`Today is ${formatDate(new Date())}`}
        actions={
          <Link href="/retailer/pos" className="btn-primary flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Open POS
          </Link>
        }
      />

      {/* Alerts */}
      {analytics?.inventoryAlerts > 0 && (
        <div className="mb-6">
          <AlertBanner
            type="warning"
            message={`⚠️ ${analytics.inventoryAlerts} inventory alert(s): ${analytics.lowStockItems} low stock, ${analytics.expiringSoon} expiring within 90 days, ${analytics.expiredItems || 0} expired`}
          />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue (30d)" value={analytics?.totalRevenue || 0} prefix="$" change={analytics?.revenueGrowth} icon={<TrendingUp className="w-4 h-4" />} color="blue" loading={isLoading} />
        <StatCard label="Orders (30d)" value={analytics?.totalOrders || 0} change={analytics?.ordersGrowth} icon={<ShoppingCart className="w-4 h-4" />} color="green" loading={isLoading} />
        <StatCard label="Products in Stock" value={analytics?.totalProducts || 0} icon={<Package className="w-4 h-4" />} color="purple" loading={isLoading} />
        <StatCard label="Inventory Alerts" value={analytics?.inventoryAlerts || 0} icon={<AlertTriangle className="w-4 h-4" />} color="orange" loading={isLoading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-lg">Revenue & Orders</h2>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <RevenueChart data={analytics?.revenueByDay || []} height={220} />
        </div>

        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-2">Orders by Status</h2>
          <p className="text-sm text-muted-foreground mb-6">Current breakdown</p>
          <DonutChart data={analytics?.ordersByStatus || []} height={200} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg">Recent Orders</h2>
            <Link href="/retailer/orders" className="text-sm text-pharma-500 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentOrders?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>}
            {recentOrders?.map((order: any) => (
              <div key={order._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pharma-500/10 flex items-center justify-center text-pharma-500">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">#{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">{order.items?.length} items • {timeAgo(order.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', statusColors[order.status] || 'bg-gray-100 text-gray-600')}>
                    {order.status?.replace(/_/g,' ')}
                  </span>
                  <span className="font-semibold text-sm">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock + top drugs */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base">Low Stock Alert</h2>
              <Link href="/retailer/stock" className="text-xs text-pharma-500 hover:underline">Manage</Link>
            </div>
            {lowStockItems?.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="w-4 h-4" /> All stocks healthy
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems?.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[150px]">{item.drugId?.name}</span>
                    <span className={cn('font-semibold', item.quantity <= 5 ? 'text-red-500' : 'text-yellow-500')}>
                      {item.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {analytics?.topDrugs?.length > 0 && (
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-display font-bold text-base mb-4">Top Selling Drugs</h2>
              <TopItemsList items={analytics.topDrugs.slice(0, 5)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
