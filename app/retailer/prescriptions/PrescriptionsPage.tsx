'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, DataTable, Modal, EmptyState, StatCard } from '@/components/shared';
import { FileText, CheckCircle, Clock, AlertTriangle, Eye, Stamp } from 'lucide-react';
import { formatDate, timeAgo, cn } from '@/utils';
import toast from 'react-hot-toast';

export function PrescriptionsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['retailer-prescriptions'],
    queryFn: async () => {
      const res = await fetch('/api/prescriptions?limit=50');
      const d = await res.json();
      return d.data || [];
    },
  });

  const verify = async (id: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true, verifiedAt: new Date() }),
      });
      if ((await res.json()).success) {
        toast.success('Prescription verified');
        qc.invalidateQueries({ queryKey: ['retailer-prescriptions'] });
        setSelected(null);
      }
    } catch { toast.error('Verification failed'); }
    finally { setVerifying(false); }
  };

  const dispense = async (rxId: string, drugIdx: number) => {
    try {
      const res = await fetch(`/api/prescriptions/${rxId}/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugIndex: drugIdx }),
      });
      if ((await res.json()).success) {
        toast.success('Drug dispensed');
        qc.invalidateQueries({ queryKey: ['retailer-prescriptions'] });
      }
    } catch { toast.error('Failed to dispense'); }
  };

  const stats = {
    total: data?.length || 0,
    pending: data?.filter((p: any) => !p.isVerified).length || 0,
    verified: data?.filter((p: any) => p.isVerified).length || 0,
    expiring: data?.filter((p: any) => {
      const d = new Date(p.expiresAt);
      const threshold = new Date(); threshold.setDate(threshold.getDate() + 7);
      return d <= threshold && d > new Date();
    }).length || 0,
  };

  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="Verify and dispense patient prescriptions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} icon={<FileText className="w-4 h-4" />} color="blue" />
        <StatCard label="Pending Verification" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="orange" />
        <StatCard label="Verified" value={stats.verified} icon={<CheckCircle className="w-4 h-4" />} color="green" />
        <StatCard label="Expiring This Week" value={stats.expiring} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>

      <DataTable
        loading={isLoading}
        data={data || []}
        onRowClick={setSelected}
        columns={[
          { key: 'prescriptionNumber', label: 'Rx #', render: r => <span className="font-mono font-medium text-sm">#{r.prescriptionNumber}</span> },
          { key: 'patient', label: 'Patient', render: r => (
            <div>
              <div className="text-sm font-medium">{r.patientId?.name || 'Unknown'}</div>
              <div className="text-xs text-muted-foreground">{r.patientId?.phone}</div>
            </div>
          )},
          { key: 'doctorName', label: 'Doctor', render: r => <span className="text-sm">Dr. {r.doctorName}</span> },
          { key: 'drugs', label: 'Drugs', render: r => <span className="text-sm">{r.drugs?.length} medication(s)</span> },
          { key: 'isVerified', label: 'Status', render: r => (
            r.isVerified
              ? <span className="badge-status bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Verified</span>
              : <span className="badge-status bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Pending</span>
          )},
          { key: 'expiresAt', label: 'Expires', render: r => <span className={cn('text-sm', new Date(r.expiresAt) < new Date() ? 'text-red-500 font-medium' : '')}>{formatDate(r.expiresAt)}</span> },
          { key: 'refills', label: 'Refills', render: r => <span className="text-sm text-muted-foreground">{r.refillsUsed}/{r.refillsAllowed}</span> },
        ]}
      />

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Prescription #${selected?.prescriptionNumber}`} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Patient: </span><span className="font-medium">{selected.patientId?.name}</span></div>
              <div><span className="text-muted-foreground">Doctor: </span><span className="font-medium">Dr. {selected.doctorName}</span></div>
              {selected.hospitalName && <div><span className="text-muted-foreground">Hospital: </span><span>{selected.hospitalName}</span></div>}
              <div><span className="text-muted-foreground">Issued: </span><span>{formatDate(selected.issuedAt)}</span></div>
              <div><span className="text-muted-foreground">Expires: </span><span className={new Date(selected.expiresAt) < new Date() ? 'text-red-500 font-medium' : ''}>{formatDate(selected.expiresAt)}</span></div>
              <div><span className="text-muted-foreground">Refills: </span><span>{selected.refillsUsed}/{selected.refillsAllowed}</span></div>
            </div>

            {selected.diagnosis && (
              <div className="bg-muted/50 rounded-xl p-3">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Diagnosis: </span>
                <span className="text-sm">{selected.diagnosis}</span>
              </div>
            )}

            {selected.imageUrl && (
              <div>
                <p className="text-sm font-medium mb-2">Prescription Image</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.imageUrl} alt="Prescription" className="w-full rounded-xl border" style={{maxHeight:200, objectFit:'contain'}} />
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-3">Prescribed Medications</h4>
              <div className="space-y-2">
                {selected.drugs?.map((drug: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{drug.drugName}</div>
                      <div className="text-xs text-muted-foreground">{drug.strength} • {drug.dosage} • {drug.frequency} • {drug.duration}</div>
                      <div className="text-xs text-muted-foreground">Qty: {drug.quantity}</div>
                    </div>
                    {drug.isDispensed ? (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 flex-shrink-0"><CheckCircle className="w-3 h-3" /> Dispensed</span>
                    ) : selected.isVerified ? (
                      <button onClick={() => dispense(selected._id, i)} className="text-xs btn-primary px-3 py-1.5 flex-shrink-0">Dispense</button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {!selected.isVerified && (
              <button onClick={() => verify(selected._id)} disabled={verifying} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                <Stamp className="w-4 h-4" />
                {verifying ? 'Verifying...' : 'Verify Prescription'}
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
