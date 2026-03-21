'use client';

import { useState } from 'react';
import { PageHeader, DataTable, StatusBadge, EmptyState, Modal } from '@/components/shared';
import { ShoppingCart, MapPin, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDate, formatCurrency, timeAgo, cn } from '@/utils';

const STATUS_STEPS = ['pending','confirmed','processing','packed','dispatched','out_for_delivery','delivered'];

export function ConsumerOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['consumer-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      const d = await res.json();
      return d.data || [];
    },
    refetchInterval: 30000,
  });

  const stepIdx = (status: string) => STATUS_STEPS.indexOf(status);

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Track all your pharmacy orders and deliveries" />

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<ShoppingCart className="w-8 h-8" />} title="No orders yet" description="Browse the pharmacy and place your first order" />
      ) : (
        <div className="space-y-4">
          {data.map((order: any) => (
            <div
              key={order._id}
              className="bg-card border rounded-2xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">#{order.orderNumber}</span>
                    <StatusBadge status={order.status} showIcon />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {order.items?.length} item(s) • {timeAgo(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(order.total)}</div>
                  <div className={cn('text-xs', order.payment?.status === 'paid' ? 'text-emerald-500' : 'text-yellow-500')}>
                    {order.payment?.status}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {order.status !== 'cancelled' && order.status !== 'refunded' && (
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    {['Placed','Confirmed','Packed','Dispatched','Delivered'].map((label, i) => {
                      const statuses = ['pending','confirmed','packed','dispatched','delivered'];
                      const isDone = stepIdx(order.status) >= stepIdx(statuses[i]);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs', isDone ? 'bg-pharma-500 border-pharma-500 text-white' : 'border-border text-muted-foreground')}>
                            {isDone ? '✓' : i+1}
                          </div>
                          <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pharma-500 to-pharma-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (stepIdx(order.status) / (STATUS_STEPS.length - 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items preview */}
              <div className="flex items-center gap-2 mt-3">
                {order.items?.slice(0,3).map((item: any, i: number) => (
                  <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                    {item.drugId?.name || 'Drug'} ×{item.quantity}
                  </span>
                ))}
                {order.items?.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{order.items.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.orderNumber}`} size="lg">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedOrder.status} showIcon />
              <span className="font-bold text-xl">{formatCurrency(selectedOrder.total)}</span>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                    <div>
                      <div className="font-medium text-sm">{item.drugId?.name || 'Unknown Drug'}</div>
                      <div className="text-xs text-muted-foreground">Batch: {item.batchNumber} • Qty: {item.quantity}</div>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              {[
                ['Subtotal', formatCurrency(selectedOrder.subtotal)],
                ['Tax', formatCurrency(selectedOrder.tax)],
                ['Discount', `-${formatCurrency(selectedOrder.discount)}`],
                ['Delivery Fee', formatCurrency(selectedOrder.deliveryFee)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Delivery info */}
            {selectedOrder.delivery?.address && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </h3>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                  {selectedOrder.delivery.address.street}, {selectedOrder.delivery.address.city},
                  {selectedOrder.delivery.address.state} {selectedOrder.delivery.address.zipCode}
                </div>
              </div>
            )}

            {/* Status history */}
            <div>
              <h3 className="font-semibold mb-3">Status History</h3>
              <div className="space-y-2">
                {selectedOrder.statusHistory?.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-pharma-500 flex-shrink-0" />
                    <span className="capitalize flex-1">{h.status?.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground text-xs">{formatDate(h.changedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
