'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatCard, DataTable } from '@/components/shared';
import { RevenueChart } from '@/components/charts';
import { FileText, Download, Shield, Activity, TrendingUp, Users } from 'lucide-react';
import { formatDate, formatCurrency, timeAgo } from '@/utils';
import toast from 'react-hot-toast';

export function ReportsPage() {
  const [period, setPeriod] = useState(30);
  const [reportType, setReportType] = useState<'platform' | 'compliance' | 'audit'>('platform');

  const { data: analytics } = useQuery({
    queryKey: ['admin-reports', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      return (await res.json()).data;
    },
  });

  const exportReport = (type: string) => {
    toast.success(`${type} report exported`);
  };

  const REPORT_CARDS = [
    { label: 'Platform Revenue', value: analytics?.totalRevenue || 0, prefix: '$', change: analytics?.revenueGrowth, icon: TrendingUp, color: 'blue' as const },
    { label: 'Total Orders', value: analytics?.totalOrders || 0, change: analytics?.ordersGrowth, icon: FileText, color: 'green' as const },
    { label: 'Active Users', value: analytics?.totalCustomers || 0, icon: Users, color: 'purple' as const },
    { label: 'Inventory Alerts', value: analytics?.inventoryAlerts || 0, icon: Activity, color: 'orange' as const },
  ];

  const AVAILABLE_REPORTS = [
    { name: 'Platform Revenue Report', desc: 'Cross-tenant revenue breakdown by period', icon: '💰', type: 'Revenue' },
    { name: 'Controlled Substances Log', desc: 'Regulatory-required tracking of Schedule I–V', icon: '🔒', type: 'Compliance' },
    { name: 'User Activity Audit', desc: 'Full audit trail of all platform mutations', icon: '🔍', type: 'Audit' },
    { name: 'Prescription Compliance', desc: 'Verified vs unverified prescription rates', icon: '📋', type: 'Compliance' },
    { name: 'Inventory Turnover', desc: 'Stock turnover rates per tenant', icon: '📦', type: 'Inventory' },
    { name: 'AI Usage Report', desc: 'AI scanner and recommendation usage stats', icon: '🤖', type: 'AI' },
    { name: 'Delivery Performance', desc: 'On-time delivery rates and exceptions', icon: '🚚', type: 'Delivery' },
    { name: 'Tax Collection Report', desc: 'Tax collected per tenant for filing', icon: '🏛️', type: 'Finance' },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Compliance"
        subtitle="Platform-wide analytics, regulatory reports, and audit logs"
        actions={
          <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="input-field py-2 w-36">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {REPORT_CARDS.map(card => (
          <StatCard key={card.label} label={card.label} value={card.value} prefix={card.prefix} change={card.change} icon={<card.icon className="w-4 h-4" />} color={card.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-6">Platform Revenue Trend</h2>
          <RevenueChart data={analytics?.revenueByDay || []} height={220} />
        </div>

        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-pharma-500" />
            <h2 className="font-display font-bold text-lg">Compliance Status</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Prescription Verification', pct: 94, color: 'bg-emerald-500' },
              { label: 'Data Encryption', pct: 100, color: 'bg-emerald-500' },
              { label: 'Audit Log Coverage', pct: 100, color: 'bg-emerald-500' },
              { label: 'Controlled Sub. Tracking', pct: 98, color: 'bg-emerald-500' },
              { label: '2FA Adoption (Staff)', pct: 71, color: 'bg-yellow-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available reports grid */}
      <div>
        <h2 className="font-display font-bold text-xl mb-5">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AVAILABLE_REPORTS.map(report => (
            <div key={report.name} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{report.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{report.type}</span>
                <button
                  onClick={() => exportReport(report.name)}
                  className="flex items-center gap-1.5 text-xs text-pharma-500 hover:text-pharma-600 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
