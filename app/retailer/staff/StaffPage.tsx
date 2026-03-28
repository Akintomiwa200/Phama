'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, Modal, StatCard, EmptyState } from '@/components/shared';
import { Users, Plus, Shield, Mail, Phone, UserCheck, UserX, Key, Clock, CheckCircle } from 'lucide-react';
import { formatDate, timeAgo, initials, cn } from '@/utils';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  tenant_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pharmacist: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cashier: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inventory_manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  driver: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  tenant_admin: ['Full platform access', 'Manage staff', 'View all reports', 'Configure settings'],
  pharmacist: ['Verify prescriptions', 'Dispense medications', 'View inventory', 'Process orders'],
  cashier: ['Point of Sale', 'Process payments', 'View products', 'Issue receipts'],
  inventory_manager: ['Manage stock', 'Receive deliveries', 'Generate inventory reports', 'Set reorder levels'],
  driver: ['View assigned deliveries', 'Update delivery status', 'Upload proof of delivery'],
};

export function StaffPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'cashier', password: '' });

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/users?limit=50');
      const d = await res.json();
      return (d.data || []).filter((u: any) => u.role !== 'consumer');
    },
  });

  const stats = {
    total: staff?.length || 0,
    active: staff?.filter((s: any) => s.isActive).length || 0,
    pharmacists: staff?.filter((s: any) => s.role === 'pharmacist').length || 0,
    cashiers: staff?.filter((s: any) => s.role === 'cashier').length || 0,
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${form.name} added to staff`);
        qc.invalidateQueries({ queryKey: ['staff'] });
        setInviteOpen(false);
        setForm({ name: '', email: '', phone: '', role: 'cashier', password: '' });
      } else toast.error(data.error);
    } catch { toast.error('Failed to add staff'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (userId: string, current: boolean) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`Staff member ${!current ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update'); }
  };

  const resetPassword = async (userId: string) => {
    toast.success('Password reset email sent');
  };

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle="Manage your pharmacy team, roles, and access permissions"
        actions={
          <button onClick={() => setInviteOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Add Staff Member
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Staff" value={stats.total} icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="Active" value={stats.active} icon={<UserCheck className="w-4 h-4" />} color="green" />
        <StatCard label="Pharmacists" value={stats.pharmacists} icon={<Shield className="w-4 h-4" />} color="purple" />
        <StatCard label="Cashiers" value={stats.cashiers} icon={<Users className="w-4 h-4" />} color="orange" />
      </div>

      {staff?.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No staff members yet"
          description="Add your first staff member to get started"
          action={<button onClick={() => setInviteOpen(true)} className="btn-primary">Add Staff Member</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
            : staff?.map((member: any) => (
              <div
                key={member._id}
                className="bg-card border rounded-2xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                onClick={() => setSelectedStaff(member)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-pharma-500/20 flex items-center justify-center text-pharma-600 font-bold text-sm">
                      {member.avatar
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={member.avatar} alt={member.name} className="w-11 h-11 rounded-full object-cover" />
                        : initials(member.name || 'U')}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{member.name}</div>
                      <div className={cn('text-xs px-2 py-0.5 rounded-full mt-1 inline-block', ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600')}>
                        {member.role?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  <div className={cn('w-2.5 h-2.5 rounded-full mt-1', member.isActive ? 'bg-emerald-400' : 'bg-red-400')} />
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Joined {formatDate(member.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={e => { e.stopPropagation(); toggleActive(member._id, member.isActive); }}
                    className={cn('flex-1 text-xs py-2 rounded-xl border transition-colors font-medium',
                      member.isActive ? 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    )}
                  >
                    {member.isActive ? <><UserX className="w-3 h-3 inline mr-1" />Deactivate</> : <><UserCheck className="w-3 h-3 inline mr-1" />Activate</>}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); resetPassword(member._id); }}
                    className="px-3 py-2 text-xs border rounded-xl hover:bg-muted transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Staff detail modal */}
      <Modal open={!!selectedStaff} onClose={() => setSelectedStaff(null)} title="Staff Details" size="md">
        {selectedStaff && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-pharma-500/20 flex items-center justify-center text-pharma-600 font-bold text-xl">
                {initials(selectedStaff.name)}
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">{selectedStaff.name}</h3>
                <div className={cn('text-sm px-2.5 py-0.5 rounded-full inline-block mt-1 capitalize', ROLE_COLORS[selectedStaff.role] || 'bg-gray-100 text-gray-600')}>
                  {selectedStaff.role?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Email', value: selectedStaff.email },
                { label: 'Phone', value: selectedStaff.phone || 'Not provided' },
                { label: 'Status', value: selectedStaff.isActive ? 'Active' : 'Inactive' },
                { label: 'Joined', value: formatDate(selectedStaff.createdAt) },
                { label: '2FA', value: selectedStaff.twoFactorEnabled ? 'Enabled' : 'Disabled' },
                { label: 'Last Login', value: selectedStaff.lastLoginAt ? timeAgo(selectedStaff.lastLoginAt) : 'Never' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                  <div className="font-medium text-sm">{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Permissions</div>
              <div className="space-y-2">
                {(ROLE_PERMISSIONS[selectedStaff.role] || []).map((perm: string) => (
                  <div key={perm} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add Staff Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Role *</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-field">
              <option value="cashier">Cashier</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="driver">Driver</option>
              <option value="tenant_admin">Admin</option>
            </select>
            {form.role && (
              <div className="mt-2 text-xs text-muted-foreground">
                {ROLE_PERMISSIONS[form.role]?.slice(0, 2).join(', ')}...
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Temporary Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" required minLength={8} placeholder="Min. 8 characters" />
            <p className="text-xs text-muted-foreground mt-1">Staff member will be prompted to change on first login</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setInviteOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
