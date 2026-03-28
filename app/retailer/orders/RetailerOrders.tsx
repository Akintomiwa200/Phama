'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, StatusBadge, Modal, StatCard } from '@/components/shared';
import { ShoppingCart, Clock, Truck, CheckCircle, XCircle, Package } from 'lucide-react';
import { formatDate, formatCurrency, timeAgo } from '@/utils';
import toast from 'react-hot-toast';

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'processing',
  processing: 'packed', packed: 'dispatched',
  dispatched: 'out_for_delivery', out_for_delivery: 'delivered',
};

export function RetailerOrders() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['retailer-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      return (await res.json()).data || [];
    },
    refetchInterval: 30000,
  });

  const stats = {
    pending: data?.filter((o: any) => o.status === 'pending').length || 0,
    processing: data?.filter((o: any) => ['confirmed','processing'].includes(o.status)).length || 0,
    dispatched: data?.filter((o: any) => ['dispatched','out_for_delivery'].includes(o.status)).length || 0,
    delivered: data?.filter((o: any) => o.status === 'delivered').length || 0,
  };

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if ((await res.json()).success) {
        toast.success(`Order → ${next.replace(/_/g, ' ')}`);
        qc.invalidateQueries({ queryKey: ['retailer-orders'] });
        setSelected(null);
      }
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    await fetch(`/api/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    qc.invalidateQueries({ queryKey: ['retailer-orders'] });
    toast.success('Order cancelled');
    setSelected(null);
  };

  const FILTERS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="Process and fulfil customer orders" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="orange" />
        <StatCard label="Processing" value={stats.processing} icon={<Package className="w-4 h-4" />} color="blue" />
        <StatCard label="Dispatched" value={stats.dispatched} icon={<Truck className="w-4 h-4" />} color="purple" />
        <StatCard label="Delivered" value={stats.delivered} icon={<CheckCircle className="w-4 h-4" />} color="green" />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${statusFilter === f.value ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:bg-muted'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        loading={isLoading}
        data={data || []}
        onRowClick={setSelected}
        columns={[
          { key: 'orderNumber', label: 'Order #', render: r => <span className="font-mono font-semibold text-sm">#{r.orderNumber}</span> },
          { key: 'customer', label: 'Customer', render: r => <div><div className="text-sm font-medium">{r.buyerId?.name || 'Customer'}</div><div className="text-xs text-muted-foreground">{r.buyerId?.phone}</div></div> },
          { key: 'items', label: 'Items', render: r => <span className="text-sm">{r.items?.length} drug(s)</span> },
          { key: 'total', label: 'Total', render: r => <span className="font-bold">{formatCurrency(r.total)}</span> },
          { key: 'payment', label: 'Payment', render: r => <StatusBadge status={r.payment?.status || 'pending'} /> },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} showIcon /> },
          { key: 'createdAt', label: 'Time', render: r => <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span> },
          { key: 'actions', label: '', render: r => {
            const next = NEXT_STATUS[r.status];
            if (!next) return null;
            return (
              <button onClick={e => { e.stopPropagation(); advanceOrder(r._id, r.status); }}
                className="text-xs btn-primary px-3 py-1.5 whitespace-nowrap">
                → {next.replace(/_/g, ' ')}
              </button>
            );
          }},
        ]}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?.orderNumber}`} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={selected.status} showIcon />
              <StatusBadge status={selected.payment?.status} />
              <span className="font-bold text-xl ml-auto">{formatCurrency(selected.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-xl p-3"><div className="text-xs text-muted-foreground mb-1">Customer</div><div className="font-medium">{selected.buyerId?.name}</div><div className="text-muted-foreground">{selected.buyerId?.phone}</div></div>
              <div className="bg-muted/50 rounded-xl p-3"><div className="text-xs text-muted-foreground mb-1">Payment</div><div className="font-medium capitalize">{selected.payment?.method}</div><div className="text-muted-foreground capitalize">{selected.payment?.status}</div></div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2">
                {selected.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl p-3 text-sm">
                    <div><div className="font-medium">{item.drugId?.name || 'Drug'}</div><div className="text-xs text-muted-foreground">Qty: {item.quantity} · Batch: {item.batchNumber}</div></div>
                    <span className="font-bold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
            {selected.delivery?.address?.street && (
              <div className="bg-muted/50 rounded-xl p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">Delivery Address</div>
                <div>{selected.delivery.address.street}, {selected.delivery.address.city}</div>
              </div>
            )}
            <div className="flex gap-3">
              {NEXT_STATUS[selected.status] && (
                <button onClick={() => advanceOrder(selected._id, selected.status)} disabled={updating} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                  Move to: {NEXT_STATUS[selected.status]?.replace(/_/g, ' ')}
                </button>
              )}
              {['pending','confirmed'].includes(selected.status) && (
                <button onClick={() => cancelOrder(selected._id)} className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
