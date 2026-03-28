'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, Modal, StatCard, AlertBanner } from '@/components/shared';
import { Package, Plus, Download, TrendingDown, AlertTriangle, Search } from 'lucide-react';
import { formatDate, formatCurrency, isExpiringSoon, isExpired, cn } from '@/utils';
import toast from 'react-hot-toast';

export function WholesalerInventory() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    drugId: '', quantity: '', batchNumber: '', lotNumber: '',
    expiryDate: '', costPrice: '', wholesalePrice: '', sellingPrice: '',
    reorderLevel: '50', maxLevel: '2000', location: '',
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['wholesaler-inventory', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/inventory?${params}`);
      const d = await res.json();
      return d.data || [];
    },
  });

  const { data: drugs } = useQuery({
    queryKey: ['drugs-list'],
    queryFn: async () => {
      const res = await fetch('/api/drugs?limit=200');
      const d = await res.json();
      return d.data || [];
    },
  });

  const stats = {
    total: inventory?.length || 0,
    totalValue: inventory?.reduce((s: number, i: any) => s + (i.quantity * i.costPrice), 0) || 0,
    lowStock: inventory?.filter((i: any) => i.quantity <= i.reorderLevel).length || 0,
    expiring: inventory?.filter((i: any) => isExpiringSoon(i.expiryDate)).length || 0,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          costPrice: Number(form.costPrice),
          wholesalePrice: Number(form.wholesalePrice),
          sellingPrice: Number(form.sellingPrice),
          reorderLevel: Number(form.reorderLevel),
          maxLevel: Number(form.maxLevel),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Stock added');
        qc.invalidateQueries({ queryKey: ['wholesaler-inventory'] });
        setAddOpen(false);
      } else toast.error(data.error);
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    if (!inventory?.length) return;
    const rows = [
      ['Drug', 'Generic', 'Batch', 'Lot', 'Qty', 'Expiry', 'Cost', 'Wholesale', 'Retail', 'Location'],
      ...inventory.map((i: any) => [
        i.drugId?.name, i.drugId?.genericName, i.batchNumber, i.lotNumber || '',
        i.quantity, formatDate(i.expiryDate), i.costPrice, i.wholesalePrice || '',
        i.sellingPrice, i.location || '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `wholesale_inventory_${Date.now()}.csv`; a.click();
  };

  return (
    <div>
      <PageHeader
        title="Warehouse Inventory"
        subtitle="Manage wholesale stock, batch tracking, and warehouse locations"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Batch
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total SKUs" value={stats.total} icon={<Package className="w-4 h-4" />} color="blue" />
        <StatCard label="Stock Value" value={stats.totalValue} prefix="$" icon={<TrendingDown className="w-4 h-4" />} color="green" />
        <StatCard label="Low Stock" value={stats.lowStock} icon={<AlertTriangle className="w-4 h-4" />} color="orange" />
        <StatCard label="Expiring (90d)" value={stats.expiring} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>

      {stats.lowStock > 0 && (
        <AlertBanner type="warning" message={`${stats.lowStock} product(s) below reorder threshold. Review and initiate replenishment.`} className="mb-6" />
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by drug name or batch number..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500/30" />
      </div>

      <DataTable
        loading={isLoading}
        data={inventory || []}
        columns={[
          { key: 'drug', label: 'Product', render: r => (
            <div>
              <div className="font-medium text-sm">{r.drugId?.name}</div>
              <div className="text-xs text-muted-foreground">{r.drugId?.genericName} · {r.drugId?.strength} · {r.drugId?.form}</div>
            </div>
          )},
          { key: 'batchNumber', label: 'Batch / Lot', render: r => (
            <div className="font-mono text-xs">
              <div>{r.batchNumber}</div>
              {r.lotNumber && <div className="text-muted-foreground">{r.lotNumber}</div>}
            </div>
          )},
          { key: 'quantity', label: 'Stock', render: r => (
            <div className="text-center">
              <span className={cn('font-bold text-sm', r.quantity <= r.reorderLevel ? 'text-red-500' : r.quantity <= r.reorderLevel * 1.5 ? 'text-yellow-500' : '')}>
                {r.quantity.toLocaleString()}
              </span>
              <div className="text-xs text-muted-foreground">min: {r.reorderLevel}</div>
            </div>
          )},
          { key: 'expiryDate', label: 'Expiry', render: r => (
            <span className={cn('text-sm', isExpired(r.expiryDate) ? 'text-red-500 font-semibold' : isExpiringSoon(r.expiryDate) ? 'text-yellow-500 font-medium' : '')}>
              {formatDate(r.expiryDate)}
            </span>
          )},
          { key: 'costPrice', label: 'Cost', render: r => <span className="text-sm">{formatCurrency(r.costPrice)}</span> },
          { key: 'wholesalePrice', label: 'Wholesale', render: r => <span className="text-sm font-medium text-pharma-600">{formatCurrency(r.wholesalePrice || r.sellingPrice)}</span> },
          { key: 'location', label: 'Location', render: r => <span className="text-xs bg-muted px-2 py-1 rounded-lg">{r.location || '—'}</span> },
          { key: 'status', label: 'Status', render: r => {
            if (isExpired(r.expiryDate)) return <span className="badge-status bg-red-100 text-red-700">Expired</span>;
            if (r.quantity <= r.reorderLevel) return <span className="badge-status bg-yellow-100 text-yellow-700">Low Stock</span>;
            if (isExpiringSoon(r.expiryDate)) return <span className="badge-status bg-orange-100 text-orange-700">Expiring</span>;
            return <span className="badge-status bg-green-100 text-green-700">In Stock</span>;
          }},
        ]}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Wholesale Batch" size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Drug *</label>
            <select value={form.drugId} onChange={e => setForm(p => ({ ...p, drugId: e.target.value }))} className="input-field" required>
              <option value="">Select drug</option>
              {drugs?.map((d: any) => <option key={d._id} value={d._id}>{d.name} — {d.strength} ({d.form})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quantity *</label>
              <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="input-field" required min="1" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Batch Number *</label>
              <input type="text" value={form.batchNumber} onChange={e => setForm(p => ({ ...p, batchNumber: e.target.value }))} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lot Number</label>
              <input type="text" value={form.lotNumber} onChange={e => setForm(p => ({ ...p, lotNumber: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Expiry Date *</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cost Price *</label>
              <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Wholesale Price *</label>
              <input type="number" step="0.01" value={form.wholesalePrice} onChange={e => setForm(p => ({ ...p, wholesalePrice: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Retail Price *</label>
              <input type="number" step="0.01" value={form.sellingPrice} onChange={e => setForm(p => ({ ...p, sellingPrice: e.target.value }))} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reorder Level</label>
              <input type="number" value={form.reorderLevel} onChange={e => setForm(p => ({ ...p, reorderLevel: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Max Level</label>
              <input type="number" value={form.maxLevel} onChange={e => setForm(p => ({ ...p, maxLevel: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Warehouse Location</label>
              <input type="text" placeholder="e.g. A-12-3" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 disabled:opacity-50">{saving ? 'Adding...' : 'Add Batch'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
