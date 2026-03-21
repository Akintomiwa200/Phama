'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatCard, DataTable, StatusBadge } from '@/components/shared';
import { RevenueChart, DonutChart } from '@/components/charts';
import { Building2, Users, Package, TrendingUp, Shield, Activity, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, timeAgo } from '@/utils';

export function AdminPlatform() {
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics?period=30');
      return (await res.json()).data;
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/tenants?limit=10');
      return (await res.json()).data || [];
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/users?limit=8');
      return (await res.json()).data || [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        subtitle="Cross-tenant system health, activity, and management"
        actions={
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <Activity className="w-4 h-4" />
            All systems operational
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={analytics?.totalRevenue || 0} prefix="$" change={analytics?.revenueGrowth} icon={<TrendingUp className="w-4 h-4" />} color="blue" />
        <StatCard label="Active Tenants" value={tenants?.length || 0} icon={<Building2 className="w-4 h-4" />} color="green" />
        <StatCard label="Platform Orders" value={analytics?.totalOrders || 0} change={analytics?.ordersGrowth} icon={<Package className="w-4 h-4" />} color="purple" />
        <StatCard label="Inventory Alerts" value={analytics?.inventoryAlerts || 0} icon={<AlertTriangle className="w-4 h-4" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-6">Platform Revenue (30 days)</h2>
          <RevenueChart data={analytics?.revenueByDay || []} height={220} />
        </div>
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-6">Orders Pipeline</h2>
          <DonutChart data={analytics?.ordersByStatus || []} height={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenants */}
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-5">Active Tenants</h2>
          <div className="space-y-3">
            {tenants?.map((t: any) => (
              <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${t.type === 'wholesaler' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                  {t.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{t.type} · {t.plan}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-5">Recent Registrations</h2>
          <div className="space-y-3">
            {recentUsers?.map((u: any) => (
              <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-pharma-500/10 flex items-center justify-center text-pharma-600 font-bold text-sm">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{u.role?.replace('_', ' ')}</span>
                  <div className="text-xs text-muted-foreground text-right mt-0.5">{timeAgo(u.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
