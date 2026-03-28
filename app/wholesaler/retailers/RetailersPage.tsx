'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, DataTable, StatCard, Modal, EmptyState } from '@/components/shared';
import { Store, TrendingUp, ShoppingCart, Star, MapPin, Phone, Mail, Building2, CheckCircle } from 'lucide-react';
import { formatDate, formatCurrency, timeAgo } from '@/utils';

export function RetailersPage() {
  const [selected, setSelected] = useState<any>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['wholesaler-retailers'],
    queryFn: async () => {
      const res = await fetch('/api/tenants?type=retailer&limit=100');
      return (await res.json()).data || [];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['retailer-orders-summary'],
    queryFn: async () => {
      const res = await fetch('/api/orders?type=retailer_to_wholesaler&limit=100');
      return (await res.json()).data || [];
    },
  });

  // Per-retailer order stats
  const retailerStats = (tenantId: string) => {
    const retailerOrders = orders?.filter((o: any) => o.tenantId === tenantId || o.buyerId?._id === tenantId) || [];
    return {
      orders: retailerOrders.length,
      revenue: retailerOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
    };
  };

  const stats = {
    total: tenants?.length || 0,
    active: tenants?.filter((t: any) => t.isActive).length || 0,
    thisMonth: tenants?.filter((t: any) => {
      const d = new Date(t.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length || 0,
  };

  return (
    <div>
      <PageHeader title="Retailer Network" subtitle="Manage relationships with your pharmacy and retail partners" />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Retailers" value={stats.total} icon={<Store className="w-4 h-4" />} color="blue" />
        <StatCard label="Active" value={stats.active} icon={<CheckCircle className="w-4 h-4" />} color="green" />
        <StatCard label="Joined This Month" value={stats.thisMonth} icon={<TrendingUp className="w-4 h-4" />} color="purple" />
      </div>

      {tenants?.length === 0 && !isLoading ? (
        <EmptyState icon={<Store className="w-8 h-8" />} title="No retailers yet" description="Retailers who order from you will appear here" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)
            : tenants?.map((tenant: any) => {
              const ts = retailerStats(tenant._id);
              return (
                <div key={tenant._id} onClick={() => setSelected(tenant)}
                  className="bg-card border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-lg">
                        {tenant.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground">{tenant.subdomain}.pharmaconnect.com</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    {tenant.address?.city && (
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{tenant.address.city}, {tenant.address.country}</div>
                    )}
                    {tenant.contact?.phone && (
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{tenant.contact.phone}</div>
                    )}
                    <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />License: {tenant.licenseNumber || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-muted/50 rounded-xl p-2.5">
                      <div className="font-bold text-pharma-600">{ts.orders}</div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5">
                      <div className="font-bold text-emerald-600">{formatCurrency(ts.revenue)}</div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Retailer Details'}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[['Type', selected.type],['Plan', selected.plan],['License', selected.licenseNumber || 'N/A'],['Joined', formatDate(selected.createdAt)],['Status', selected.isActive ? 'Active' : 'Inactive'],['Subdomain', selected.subdomain]].map(([l, v]) => (
                <div key={l} className="bg-muted/50 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
                  <div className="font-medium capitalize">{v}</div>
                </div>
              ))}
            </div>
            {selected.address && (
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">Address</div>
                <div>{selected.address.street}, {selected.address.city}, {selected.address.state}, {selected.address.country}</div>
              </div>
            )}
            {selected.contact && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Contact</div>
                {selected.contact.name && <div>👤 {selected.contact.name}</div>}
                {selected.contact.email && <div>✉️ {selected.contact.email}</div>}
                {selected.contact.phone && <div>📞 {selected.contact.phone}</div>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
