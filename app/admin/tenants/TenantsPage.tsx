'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, Modal, StatCard } from '@/components/shared';
import { Building2, Plus, Store, Factory, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, cn } from '@/utils';
import toast from 'react-hot-toast';

export function TenantsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'retailer', subdomain: '', plan: 'starter', licenseNumber: '', contactPhone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await fetch('/api/tenants?limit=100');
      return (await res.json()).data || [];
    },
  });

  const stats = {
    total: data?.length || 0,
    wholesalers: data?.filter((t: any) => t.type === 'wholesaler').length || 0,
    retailers: data?.filter((t: any) => t.type === 'retailer').length || 0,
    active: data?.filter((t: any) => t.isActive).length || 0,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, contact: { phone: form.contactPhone } }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Tenant created');
        qc.invalidateQueries({ queryKey: ['tenants'] });
        setAddOpen(false);
      } else toast.error(data.error);
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/tenants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    qc.invalidateQueries({ queryKey: ['tenants'] });
    toast.success(`Tenant ${!current ? 'activated' : 'deactivated'}`);
  };

  return (
    <div>
      <PageHeader title="Tenant Management" subtitle="Manage wholesalers and retailers on the platform"
        actions={<button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add Tenant</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tenants" value={stats.total} icon={<Building2 className="w-4 h-4" />} color="blue" />
        <StatCard label="Wholesalers" value={stats.wholesalers} icon={<Factory className="w-4 h-4" />} color="purple" />
        <StatCard label="Retailers" value={stats.retailers} icon={<Store className="w-4 h-4" />} color="green" />
        <StatCard label="Active" value={stats.active} icon={<CheckCircle className="w-4 h-4" />} color="green" />
      </div>

      <DataTable
        loading={isLoading}
        data={data || []}
        columns={[
          { key: 'name', label: 'Tenant', render: r => (
            <div className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold', r.type === 'wholesaler' ? 'bg-blue-500' : 'bg-emerald-500')}>
                {r.name?.[0]}
              </div>
              <div>
                <div className="font-medium text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.subdomain}.pharmaconnect.com</div>
              </div>
            </div>
          )},
          { key: 'type', label: 'Type', render: r => <span className={cn('badge-status capitalize', r.type === 'wholesaler' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>{r.type}</span> },
          { key: 'plan', label: 'Plan', render: r => <span className="badge-status bg-purple-100 text-purple-700 capitalize">{r.plan}</span> },
          { key: 'licenseNumber', label: 'License', render: r => <span className="font-mono text-xs text-muted-foreground">{r.licenseNumber || '—'}</span> },
          { key: 'createdAt', label: 'Joined', render: r => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span> },
          { key: 'isActive', label: 'Status', render: r => (
            <button onClick={() => toggleActive(r._id, r.isActive)} className={cn('badge-status cursor-pointer hover:opacity-80 transition-opacity', r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
              {r.isActive ? <><CheckCircle className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
            </button>
          )},
        ]}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Tenant">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Business Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type *</label>
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className="input-field">
                <option value="retailer">Retailer / Pharmacy</option>
                <option value="wholesaler">Wholesaler</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Plan *</label>
              <select value={form.plan} onChange={e => setForm(p => ({...p, plan: e.target.value}))} className="input-field">
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Subdomain *</label>
            <div className="flex items-center">
              <input value={form.subdomain} onChange={e => setForm(p => ({...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')}))} className="input-field rounded-r-none" placeholder="my-pharmacy" required />
              <span className="px-3 py-3 bg-muted border border-l-0 rounded-r-xl text-sm text-muted-foreground">.pharmaconnect.com</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">License Number</label>
            <input value={form.licenseNumber} onChange={e => setForm(p => ({...p, licenseNumber: e.target.value}))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Contact Phone *</label>
            <input type="tel" value={form.contactPhone} onChange={e => setForm(p => ({...p, contactPhone: e.target.value}))} className="input-field" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 disabled:opacity-50">{saving ? 'Creating...' : 'Create Tenant'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
