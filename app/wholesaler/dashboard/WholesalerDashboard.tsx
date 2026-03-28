'use client'

import { PageHeader, StatCard, DataTable, StatusBadge } from '@/components/shared';
import { RevenueChart, TopItemsList, SalesBarChart } from '@/components/charts';
import { TrendingUp, ShoppingCart, Store, Package, DollarSign, Truck, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, timeAgo, cn } from '@/utils';
import Link from 'next/link';

export function WholesalerDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['wholesaler-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics?period=30');
      const d = await res.json();
      return d.data;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['wholesaler-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders?type=retailer_to_wholesaler&limit=8');
      const d = await res.json();
      return d.data || [];
    },
    refetchInterval: 60000,
  });

  return (
    <div>
      <PageHeader
        title="Wholesaler Dashboard"
        subtitle={`Performance overview — ${formatDate(new Date())}`}
        actions={
          <Link href="/wholesaler/orders" className="btn-primary flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Manage Orders
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue (30d)" value={analytics?.totalRevenue || 0} prefix="$" change={analytics?.revenueGrowth} icon={<TrendingUp className="w-4 h-4" />} color="blue" loading={isLoading} />
        <StatCard label="Orders (30d)" value={analytics?.totalOrders || 0} change={analytics?.ordersGrowth} icon={<ShoppingCart className="w-4 h-4" />} color="green" loading={isLoading} />
        <StatCard label="Active Retailers" value={analytics?.totalCustomers || 0} icon={<Store className="w-4 h-4" />} color="purple" loading={isLoading} />
        <StatCard label="Products in Stock" value={analytics?.totalProducts || 0} icon={<Package className="w-4 h-4" />} color="orange" loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Revenue Trend</h2>
          <p className="text-sm text-muted-foreground mb-6">Last 30 days</p>
          <RevenueChart data={analytics?.revenueByDay || []} height={240} />
        </div>
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Top Products</h2>
          <p className="text-sm text-muted-foreground mb-6">By revenue</p>
          <TopItemsList items={analytics?.topDrugs?.slice(0,6) || []} />
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg">Retailer Orders</h2>
            <p className="text-sm text-muted-foreground">Incoming bulk orders from retailers</p>
          </div>
          <Link href="/wholesaler/orders" className="text-sm text-pharma-500 hover:underline">View all →</Link>
        </div>
        <DataTable
          data={recentOrders || []}
          columns={[
            { key: 'orderNumber', label: 'Order #', render: r => <span className="font-mono font-medium text-sm">#{r.orderNumber}</span> },
            { key: 'buyer', label: 'Retailer', render: r => (
              <div>
                <div className="text-sm font-medium">{r.buyerId?.name || 'Retailer'}</div>
                <div className="text-xs text-muted-foreground">{r.buyerId?.email}</div>
              </div>
            )},
            { key: 'items', label: 'Items', render: r => <span className="text-sm">{r.items?.length} SKU(s)</span> },
            { key: 'total', label: 'Value', render: r => <span className="font-semibold">{formatCurrency(r.total)}</span> },
            { key: 'payment', label: 'Payment', render: r => <StatusBadge status={r.payment?.status || 'pending'} /> },
            { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} showIcon /> },
            { key: 'createdAt', label: 'Date', render: r => <span className="text-sm text-muted-foreground">{timeAgo(r.createdAt)}</span> },
          ]}
        />
      </div>
    </div>
  );
}
