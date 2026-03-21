'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, StatusBadge, Modal, StatCard } from '@/components/shared';
import { ShoppingCart, CheckCircle, Truck, Package, Clock, DollarSign, Eye, ChevronDown } from 'lucide-react';
import { formatDate, formatCurrency, timeAgo, cn } from '@/utils';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'dispatched', 'delivered'];

export function WholesalerOrders() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['w-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      const d = await res.json();
      return d.data || [];
    },
    refetchInterval: 30000,
  });

  const stats = {
    pending: data?.filter((o: any) => o.status === 'pending').length || 0,
    processing: data?.filter((o: any) => ['confirmed','processing','packed'].includes(o.status)).length || 0,
    dispatched: data?.filter((o: any) => o.status === 'dispatched').length || 0,
    revenue: data?.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + o.total, 0) || 0,
  };

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, note: `Status advanced to ${nextStatus}` }),
      });
      if ((await res.json()).success) {
        toast.success(`Order moved to ${nextStatus}`);
        qc.invalidateQueries({ queryKey: ['w-orders'] });
        setSelectedOrder((prev: any) => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Dispatched', value: 'dispatched' },
    { label: 'Delivered', value: 'delivered' },
  ];

  return (
    <div>
      <PageHeader
        title="Order Management"
        subtitle="Process and fulfil retailer bulk orders"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="orange" />
        <StatCard label="In Progress" value={stats.processing} icon={<Package className="w-4 h-4" />} color="blue" />
        <StatCard label="Dispatched" value={stats.dispatched} icon={<Truck className="w-4 h-4" />} color="purple" />
        <StatCard label="Revenue Delivered" value={stats.revenue} prefix="$" icon={<DollarSign className="w-4 h-4" />} color="green" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
              statusFilter === f.value ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:bg-muted'
            )}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        loading={isLoading}
        data={data || []}
        onRowClick={setSelectedOrder}
        columns={[
          { key: 'orderNumber', label: 'Order #', render: r => <span className="font-mono font-semibold text-sm">#{r.orderNumber}</span> },
          { key: 'buyer', label: 'Retailer', render: r => (
            <div>
              <div className="text-sm font-medium">{r.buyerId?.name || 'Retailer'}</div>
              <div className="text-xs text-muted-foreground">{r.buyerId?.email}</div>
            </div>
          )},
          { key: 'items', label: 'Items', render: r => (
            <div className="text-sm">
              <div>{r.items?.length} SKU(s)</div>
              <div className="text-xs text-muted-foreground">{r.items?.reduce((s: number, i: any) => s + i.quantity, 0).toLocaleString()} units</div>
            </div>
          )},
          { key: 'total', label: 'Value', render: r => <span className="font-bold">{formatCurrency(r.total)}</span> },
          { key: 'payment', label: 'Payment', render: r => <StatusBadge status={r.payment?.status || 'pending'} /> },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} showIcon /> },
          { key: 'createdAt', label: 'Placed', render: r => <span className="text-sm text-muted-foreground">{timeAgo(r.createdAt)}</span> },
          { key: 'actions', label: '', render: r => {
            const idx = STATUS_FLOW.indexOf(r.status);
            const canAdvance = idx >= 0 && idx < STATUS_FLOW.length - 1;
            if (!canAdvance) return null;
            return (
              <button
                onClick={e => { e.stopPropagation(); advanceStatus(r._id, r.status); }}
                className="text-xs btn-primary px-3 py-1.5 whitespace-nowrap"
              >
                → {STATUS_FLOW[idx + 1]}
              </button>
            );
          }},
        ]}
      />

      {/* Order detail modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.orderNumber}`} size="xl">
        {selectedOrder && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-2xl">
              <StatusBadge status={selectedOrder.status} showIcon />
              <StatusBadge status={selectedOrder.payment?.status} />
              <span className="font-bold text-xl ml-auto">{formatCurrency(selectedOrder.total)}</span>
            </div>

            {/* Retailer info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-2">Retailer</p>
                <p className="font-medium">{selectedOrder.buyerId?.name}</p>
                <p className="text-muted-foreground">{selectedOrder.buyerId?.email}</p>
                <p className="text-muted-foreground">{selectedOrder.buyerId?.phone}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-2">Order Info</p>
                <p>Placed: {formatDate(selectedOrder.createdAt)}</p>
                <p>Payment: {selectedOrder.payment?.method}</p>
                {selectedOrder.notes && <p className="text-muted-foreground mt-1">{selectedOrder.notes}</p>}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.drugId?.name || 'Drug'}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.drugId?.genericName} · Batch: {item.batchNumber} · Qty: {item.quantity.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{formatCurrency(item.total)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
            </div>

            {/* Status history */}
            <div>
              <h3 className="font-semibold mb-3">Status History</h3>
              <div className="space-y-2">
                {selectedOrder.statusHistory?.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-pharma-500 flex-shrink-0" />
                    <span className="capitalize flex-1 font-medium">{h.status?.replace(/_/g, ' ')}</span>
                    {h.note && <span className="text-muted-foreground text-xs">{h.note}</span>}
                    <span className="text-muted-foreground text-xs">{formatDate(h.changedAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advance status */}
            {STATUS_FLOW.indexOf(selectedOrder.status) < STATUS_FLOW.length - 1 && (
              <button
                onClick={() => advanceStatus(selectedOrder._id, selectedOrder.status)}
                disabled={updating}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                {updating ? 'Updating...' : `Advance to: ${STATUS_FLOW[STATUS_FLOW.indexOf(selectedOrder.status) + 1]}`}
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
