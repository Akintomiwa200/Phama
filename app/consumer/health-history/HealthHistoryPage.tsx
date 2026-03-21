'use client';

import { useState } from 'react';
import { PageHeader, DataTable, StatusBadge, EmptyState, Spinner } from '@/components/shared';
import { Heart, Calendar, Stethoscope, Pill, FileText, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDate, timeAgo, cn } from '@/utils';

export function HealthHistoryPage() {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'prescriptions' | 'orders'>('symptoms');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: symptomLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['symptom-logs'],
    queryFn: async () => {
      const res = await fetch('/api/symptoms?limit=50');
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: prescriptions, isLoading: rxLoading } = useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: async () => {
      const res = await fetch('/api/prescriptions?limit=50');
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders?limit=50');
      const data = await res.json();
      return data.data || [];
    },
  });

  const TABS = [
    { key: 'symptoms', label: 'Symptom Logs', icon: Activity, count: symptomLogs?.length },
    { key: 'prescriptions', label: 'Prescriptions', icon: FileText, count: prescriptions?.length },
    { key: 'orders', label: 'Order History', icon: Pill, count: orders?.length },
  ] as const;

  return (
    <div>
      <PageHeader title="Health History" subtitle="Your complete medical and pharmacy activity timeline" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Symptom Logs', value: symptomLogs?.length || 0, icon: Activity, color: 'text-purple-500 bg-purple-500/10' },
          { label: 'Prescriptions', value: prescriptions?.length || 0, icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Orders Placed', value: orders?.length || 0, icon: Pill, color: 'text-green-500 bg-green-500/10' },
          { label: 'Active Rx', value: prescriptions?.filter((p: any) => p.isActive)?.length || 0, icon: Heart, color: 'text-red-500 bg-red-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-card border rounded-2xl p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.color)}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-display font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-pharma-500/10 text-pharma-600 dark:text-pharma-400 text-xs px-1.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Symptom Logs Timeline */}
      {activeTab === 'symptoms' && (
        <div>
          {logsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !symptomLogs?.length ? (
            <EmptyState icon={<Activity className="w-8 h-8" />} title="No symptom logs yet" description="Use the 3D Body Map to log symptoms and get AI recommendations" />
          ) : (
            <div className="space-y-0 relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              {symptomLogs.map((log: any) => (
                <div key={log._id} className="relative pl-14 pb-6">
                  <div className="absolute left-3 top-1 w-5 h-5 rounded-full bg-card border-2 border-pharma-500 z-10" />
                  <div className="bg-card border rounded-2xl overflow-hidden">
                    <button
                      className="w-full flex items-start justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-sm">{log.bodyParts?.join(', ')}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            log.severity >= 7 ? 'bg-red-100 text-red-700' : log.severity >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          )}>
                            Severity {log.severity}/10
                          </span>
                          {log.isResolved && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Resolved</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {log.symptoms?.slice(0, 4).map((s: string) => (
                            <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{s}</span>
                          ))}
                          {log.symptoms?.length > 4 && <span className="text-xs text-muted-foreground">+{log.symptoms.length - 4} more</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className="text-xs text-muted-foreground">{timeAgo(log.loggedAt)}</span>
                        {expandedLog === log._id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {expandedLog === log._id && log.aiRecommendations?.length > 0 && (
                      <div className="border-t px-4 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Recommendations Given</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {log.aiRecommendations.map((rec: any, i: number) => (
                            <div key={i} className="bg-muted/50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">{rec.drugName}</span>
                                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', rec.isOTC ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                                  {rec.isOTC ? 'OTC' : 'Rx'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{rec.dosage} • {rec.frequency}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div>
          {rxLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !prescriptions?.length ? (
            <EmptyState icon={<FileText className="w-8 h-8" />} title="No prescriptions" description="Your prescriptions will appear here when issued by a doctor" />
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx: any) => (
                <div key={rx._id} className="bg-card border rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold">#{rx.prescriptionNumber}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', rx.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {rx.isVerified ? 'Verified' : 'Pending Verification'}
                        </span>
                        {!rx.isActive && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expired</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">Dr. {rx.doctorName} {rx.hospitalName && `• ${rx.hospitalName}`}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Issued: {formatDate(rx.issuedAt)}</div>
                      <div>Expires: {formatDate(rx.expiresAt)}</div>
                      {rx.refillsAllowed > 0 && <div>Refills: {rx.refillsUsed}/{rx.refillsAllowed}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rx.drugs?.map((drug: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <Pill className="w-4 h-4 text-pharma-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{drug.drugName}</div>
                          <div className="text-xs text-muted-foreground">{drug.dosage} • {drug.frequency} • {drug.duration}</div>
                        </div>
                        {drug.isDispensed && <span className="ml-auto text-xs text-emerald-600 flex-shrink-0">✓ Dispensed</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {activeTab === 'orders' && (
        <div>
          {ordersLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !orders?.length ? (
            <EmptyState icon={<Pill className="w-8 h-8" />} title="No orders yet" description="Your pharmacy orders will appear here" />
          ) : (
            <DataTable
              columns={[
                { key: 'orderNumber', label: 'Order #', render: r => <span className="font-mono text-sm font-medium">#{r.orderNumber}</span> },
                { key: 'items', label: 'Items', render: r => <span className="text-sm">{r.items?.length} drug(s)</span> },
                { key: 'total', label: 'Total', render: r => <span className="font-semibold">${r.total?.toFixed(2)}</span> },
                { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
                { key: 'createdAt', label: 'Date', render: r => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span> },
              ]}
              data={orders}
            />
          )}
        </div>
      )}
    </div>
  );
}
