'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, StatusBadge, Modal, AlertBanner, StatCard, EmptyState } from '@/components/shared';
import { Package, Plus, AlertTriangle, Filter, Download, RefreshCw, BarChart3 } from 'lucide-react';
import { formatDate, formatCurrency, isExpiringSoon, isExpired, cn } from '@/utils';
import toast from 'react-hot-toast';
import { z } from 'zod';

export function StockPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'low' | 'expiring' | 'expired'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ drugId: '', quantity: '', batchNumber: '', expiryDate: '', costPrice: '', sellingPrice: '', reorderLevel: '10' });
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams({ limit: '100' });
  if (filter === 'low') params.set('lowStock', 'true');
  if (filter === 'expiring') params.set('expiringSoon', 'true');
  if (filter === 'expired') params.set('expired', 'true');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', filter],
    queryFn: async () => {
      const res = await fetch(`/api/inventory?${params}`);
      const d = await res.json();
      return d.data || [];
    },
  });

  const { data: drugs } = useQuery({
    queryKey: ['drugs-list'],
    queryFn: async () => {
      const res = await fetch('/api/drugs?limit=100');
      const d = await res.json();
      return d.data || [];
    },
  });

  const stats = {
    total: data?.length || 0,
    lowStock: data?.filter((i: any) => i.quantity <= i.reorderLevel).length || 0,
    expiring: data?.filter((i: any) => isExpiringSoon(i.expiryDate)).length || 0,
    expired: data?.filter((i: any) => isExpired(i.expiryDate)).length || 0,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), reorderLevel: Number(form.reorderLevel) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Stock added successfully');
        qc.invalidateQueries({ queryKey: ['inventory'] });
        setAddOpen(false);
        setForm({ drugId: '', quantity: '', batchNumber: '', expiryDate: '', costPrice: '', sellingPrice: '', reorderLevel: '10' });
      } else {
        toast.error(data.error);
      }
    } catch { toast.error('Failed to add stock'); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    if (!data?.length) return;
    const headers = ['Drug', 'Batch', 'Quantity', 'Expiry', 'Cost Price', 'Selling Price', 'Status'];
    const rows = data.map((i: any) => [
      i.drugId?.name, i.batchNumber, i.quantity,
      formatDate(i.expiryDate), i.costPrice, i.sellingPrice,
      isExpired(i.expiryDate) ? 'Expired' : i.quantity <= i.reorderLevel ? 'Low Stock' : 'OK'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inventory_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const FILTERS = [
    { key: 'all', label: 'All Stock', count: stats.total },
    { key: 'low', label: 'Low Stock', count: stats.lowStock },
    { key: 'expiring', label: 'Expiring Soon', count: stats.expiring },
    { key: 'expired', label: 'Expired', count: stats.expired },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Stock Management"
        subtitle="Monitor inventory levels, expiry dates, and reorder alerts"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />Export CSV
            </button>
            <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />Add Stock
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total SKUs" value={stats.total} icon={<Package className="w-4 h-4" />} color="blue" />
        <StatCard label="Low Stock" value={stats.lowStock} icon={<AlertTriangle className="w-4 h-4" />} color="orange" />
        <StatCard label="Expiring (<90d)" value={stats.expiring} icon={<AlertTriangle className="w-4 h-4" />} color="orange" />
        <StatCard label="Expired" value={stats.expired} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>

      {stats.lowStock > 0 && (
        <div className="mb-6">
          <AlertBanner type="warning" message={`${stats.lowStock} item(s) below reorder level. Place orders with your wholesaler to avoid stockouts.`} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
              filter === f.key ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:bg-muted'
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filter === f.key ? 'bg-white/20' : 'bg-muted')}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        loading={isLoading}
        columns={[
          { key: 'drug', label: 'Drug', render: r => (
            <div>
              <div className="font-medium text-sm">{r.drugId?.name}</div>
              <div className="text-xs text-muted-foreground">{r.drugId?.genericName} • {r.drugId?.strength}</div>
            </div>
          )},
          { key: 'batchNumber', label: 'Batch #', render: r => <span className="font-mono text-sm">{r.batchNumber}</span> },
          { key: 'quantity', label: 'Qty', render: r => (
            <span className={cn('font-semibold', r.quantity <= r.reorderLevel ? 'text-red-500' : r.quantity <= r.reorderLevel * 2 ? 'text-yellow-500' : 'text-foreground')}>
              {r.quantity}
            </span>
          )},
          { key: 'reorderLevel', label: 'Reorder At', render: r => <span className="text-sm text-muted-foreground">{r.reorderLevel}</span> },
          { key: 'expiryDate', label: 'Expiry', render: r => (
            <span className={cn('text-sm font-medium', isExpired(r.expiryDate) ? 'text-red-500' : isExpiringSoon(r.expiryDate) ? 'text-yellow-500' : 'text-foreground')}>
              {formatDate(r.expiryDate)}
              {isExpired(r.expiryDate) && ' ⚠️'}
            </span>
          )},
          { key: 'sellingPrice', label: 'Price', render: r => formatCurrency(r.sellingPrice) },
          { key: 'status', label: 'Status', render: r => {
            if (isExpired(r.expiryDate)) return <span className="badge-status bg-red-100 text-red-700">Expired</span>;
            if (r.quantity <= r.reorderLevel) return <span className="badge-status bg-yellow-100 text-yellow-700">Low Stock</span>;
            if (isExpiringSoon(r.expiryDate)) return <span className="badge-status bg-orange-100 text-orange-700">Expiring</span>;
            return <span className="badge-status bg-green-100 text-green-700">OK</span>;
          }},
        ]}
        data={data || []}
      />

      {/* Add Stock Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Stock">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Drug *</label>
            <select value={form.drugId} onChange={e => setForm(p => ({...p, drugId: e.target.value}))} className="input-field" required>
              <option value="">Select drug</option>
              {drugs?.map((d: any) => <option key={d._id} value={d._id}>{d.name} — {d.strength}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quantity *</label>
              <input type="number" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} className="input-field" required min="1" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Batch Number *</label>
              <input type="text" value={form.batchNumber} onChange={e => setForm(p => ({...p, batchNumber: e.target.value}))} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Expiry Date *</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({...p, expiryDate: e.target.value}))} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cost Price *</label>
              <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(p => ({...p, costPrice: e.target.value}))} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Selling Price *</label>
              <input type="number" step="0.01" value={form.sellingPrice} onChange={e => setForm(p => ({...p, sellingPrice: e.target.value}))} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Reorder Level</label>
            <input type="number" value={form.reorderLevel} onChange={e => setForm(p => ({...p, reorderLevel: e.target.value}))} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
