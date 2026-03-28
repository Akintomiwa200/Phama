'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, StatCard, DataTable, Modal, EmptyState } from '@/components/shared';
import { Stethoscope, Users, Clock, CheckCircle, FileText, Video, MessageCircle, Star, Send, Pill, AlertTriangle, Sparkles } from 'lucide-react';
import { cn, formatDate, timeAgo } from '@/utils';
import { Spinner } from '@/components/shared';
import toast from 'react-hot-toast';

export function DoctorDashboard() {
  const qc = useQueryClient();
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState({ diagnosis: '', treatment: '', doctorNotes: '' });
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [rxForm, setRxForm] = useState({ drugs: [{ drugName: '', dosage: '', frequency: '', duration: '', quantity: 1 }], notes: '' });
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['doctor-consultations'],
    queryFn: async () => {
      const res = await fetch('/api/consultations?limit=20');
      return (await res.json()).data || [];
    },
    refetchInterval: activeConsultation ? 5000 : 30000,
  });

  const stats = {
    pending: consultations?.filter((c: any) => c.status === 'pending').length || 0,
    inProgress: consultations?.filter((c: any) => c.status === 'in_progress').length || 0,
    completed: consultations?.filter((c: any) => c.status === 'completed').length || 0,
    today: consultations?.filter((c: any) => new Date(c.createdAt).toDateString() === new Date().toDateString()).length || 0,
  };

  const acceptConsultation = async (id: string) => {
    const res = await fetch(`/api/consultations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const data = await res.json();
    if (data.success) {
      setActiveConsultation(data.data);
      qc.invalidateQueries({ queryKey: ['doctor-consultations'] });
      toast.success('Consultation accepted');
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeConsultation || sending) return;
    const content = msgInput; setMsgInput(''); setSending(true);
    try {
      const res = await fetch(`/api/consultations/${activeConsultation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { content, type: 'text' } }),
      });
      const data = await res.json();
      if (data.success) setActiveConsultation(data.data);
    } catch { toast.error('Failed'); }
    finally { setSending(false); }
  };

  const saveNotes = async () => {
    if (!activeConsultation) return;
    const res = await fetch(`/api/consultations/${activeConsultation._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
    const data = await res.json();
    if (data.success) { setActiveConsultation(data.data); toast.success('Notes saved'); }
  };

  const issuePrescription = async () => {
    if (!activeConsultation) return;
    const validDrugs = rxForm.drugs.filter(d => d.drugName.trim());
    if (!validDrugs.length) { toast.error('Add at least one drug'); return; }
    const res = await fetch(`/api/consultations/${activeConsultation._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugs: validDrugs, diagnosis: notes.diagnosis, notes: rxForm.notes }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Prescription issued!');
      setPrescribeOpen(false);
      setActiveConsultation(null);
      qc.invalidateQueries({ queryKey: ['doctor-consultations'] });
    }
  };

  const getAISuggestion = async () => {
    if (!activeConsultation) return;
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyParts: activeConsultation.bodyParts || [],
          symptoms: activeConsultation.symptoms || [],
          severity: activeConsultation.severity || 5,
        }),
      });
      const data = await res.json();
      if (data.success && data.data.recommendations?.length) {
        const top = data.data.recommendations[0];
        setAiDiagnosis(`AI suggests: ${top.drugName} (${top.dosage}, ${top.frequency}) for ${top.indication}`);
        toast.success('AI analysis complete');
      }
    } catch { toast.error('AI analysis failed'); }
    finally { setLoadingAI(false); }
  };

  return (
    <div>
      <PageHeader title="Doctor Dashboard" subtitle="Manage consultations and patient care" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="orange" />
        <StatCard label="In Progress" value={stats.inProgress} icon={<Stethoscope className="w-4 h-4" />} color="blue" />
        <StatCard label="Completed Today" value={stats.today} icon={<CheckCircle className="w-4 h-4" />} color="green" />
        <StatCard label="Total This Month" value={stats.completed} icon={<Users className="w-4 h-4" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue */}
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-5">Consultation Queue</h2>
          {isLoading ? <div className="flex justify-center py-8"><Spinner /></div>
            : consultations?.filter((c: any) => ['pending', 'in_progress'].includes(c.status)).length === 0 ? (
              <EmptyState icon={<Stethoscope className="w-8 h-8" />} title="No pending consultations" description="You'll be notified when a patient books" />
            ) : (
              <div className="space-y-3">
                {consultations?.filter((c: any) => ['pending', 'in_progress'].includes(c.status)).map((cons: any) => (
                  <div key={cons._id} className={cn('rounded-xl border p-4 transition-all', cons.status === 'in_progress' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-pharma-300')}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{cons.patientId?.name || 'Patient'}</div>
                        <div className="text-xs text-muted-foreground capitalize">{cons.consultationType} · {cons.channel}</div>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', cons.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700')}>
                        {cons.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cons.chiefComplaint}</p>
                    {cons.symptoms?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {cons.symptoms.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {cons.status === 'pending' ? (
                        <button onClick={() => acceptConsultation(cons._id)} className="flex-1 btn-primary py-2 text-sm">Accept</button>
                      ) : (
                        <button onClick={() => setActiveConsultation(cons)} className="flex-1 btn-primary py-2 text-sm">Open Session</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Active session or history */}
        {activeConsultation ? (
          <div className="bg-card border rounded-2xl flex flex-col overflow-hidden" style={{ maxHeight: 600 }}>
            <div className="flex items-center gap-3 p-4 border-b bg-blue-50 dark:bg-blue-900/20">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-600 text-sm">
                {activeConsultation.patientId?.name?.[0] || 'P'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{activeConsultation.patientId?.name}</div>
                <div className="text-xs text-muted-foreground">{activeConsultation.chiefComplaint}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={getAISuggestion} disabled={loadingAI} className="p-2 bg-pharma-500/10 text-pharma-500 rounded-xl hover:bg-pharma-500/20 transition-colors" title="AI Suggestion">
                  {loadingAI ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                </button>
                <button onClick={() => setPrescribeOpen(true)} className="p-2 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 transition-colors" title="Issue Prescription">
                  <FileText className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveConsultation(null)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {aiDiagnosis && (
              <div className="px-4 py-2.5 bg-pharma-500/5 border-b text-xs text-pharma-600 dark:text-pharma-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />{aiDiagnosis}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConsultation.messages?.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-6">
                  <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p>Session started. Send a message to begin.</p>
                </div>
              )}
              {activeConsultation.messages?.map((msg: any, i: number) => {
                const isDoctor = msg.senderRole === 'doctor';
                return (
                  <div key={i} className={cn('flex gap-2', isDoctor ? 'flex-row-reverse' : '')}>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', isDoctor ? 'bg-blue-500 text-white' : 'bg-muted')}>
                      {isDoctor ? 'Dr' : 'P'}
                    </div>
                    <div className={cn('max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed', isDoctor ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm')}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="border-t p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={notes.diagnosis} onChange={e => setNotes(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Diagnosis..." className="input-field py-2 text-xs" />
                <input value={notes.treatment} onChange={e => setNotes(p => ({ ...p, treatment: e.target.value }))} placeholder="Treatment plan..." className="input-field py-2 text-xs" />
              </div>
              <div className="flex gap-2">
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Message patient..." className="flex-1 input-field py-2 text-sm" />
                <button onClick={saveNotes} className="px-3 py-2 text-xs border rounded-xl hover:bg-muted transition-colors">Save</button>
                <button onClick={sendMessage} disabled={!msgInput.trim() || sending} className="btn-primary px-3 py-2 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-5">Recent Consultations</h2>
            <div className="space-y-3">
              {consultations?.filter((c: any) => c.status === 'completed').slice(0, 5).map((cons: any) => (
                <div key={cons._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{cons.patientId?.name?.[0] || 'P'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{cons.patientId?.name || 'Patient'}</div>
                    <div className="text-xs text-muted-foreground truncate">{cons.diagnosis || cons.chiefComplaint}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                    <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(cons.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prescribe Modal */}
      <Modal open={prescribeOpen} onClose={() => setPrescribeOpen(false)} title="Issue Prescription" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Diagnosis</label>
            <input value={notes.diagnosis} onChange={e => setNotes(p => ({ ...p, diagnosis: e.target.value }))} className="input-field" placeholder="e.g. Upper respiratory tract infection" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Prescribed Drugs</label>
              <button onClick={() => setRxForm(p => ({ ...p, drugs: [...p.drugs, { drugName: '', dosage: '', frequency: '', duration: '', quantity: 1 }] }))} className="text-xs text-pharma-500 hover:underline">+ Add drug</button>
            </div>
            {rxForm.drugs.map((drug, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2 p-3 bg-muted/50 rounded-xl">
                <input value={drug.drugName} onChange={e => setRxForm(p => ({ ...p, drugs: p.drugs.map((d, j) => j === i ? { ...d, drugName: e.target.value } : d) }))} placeholder="Drug name *" className="input-field col-span-2" />
                <input value={drug.dosage} onChange={e => setRxForm(p => ({ ...p, drugs: p.drugs.map((d, j) => j === i ? { ...d, dosage: e.target.value } : d) }))} placeholder="Dosage (e.g. 500mg)" className="input-field" />
                <input value={drug.frequency} onChange={e => setRxForm(p => ({ ...p, drugs: p.drugs.map((d, j) => j === i ? { ...d, frequency: e.target.value } : d) }))} placeholder="Frequency (e.g. 3x daily)" className="input-field" />
                <input value={drug.duration} onChange={e => setRxForm(p => ({ ...p, drugs: p.drugs.map((d, j) => j === i ? { ...d, duration: e.target.value } : d) }))} placeholder="Duration (e.g. 7 days)" className="input-field" />
                <input type="number" value={drug.quantity} onChange={e => setRxForm(p => ({ ...p, drugs: p.drugs.map((d, j) => j === i ? { ...d, quantity: +e.target.value } : d) }))} placeholder="Qty" className="input-field" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Doctor Notes</label>
            <textarea value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Additional instructions for patient..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPrescribeOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted">Cancel</button>
            <button onClick={issuePrescription} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
              <Pill className="w-4 h-4" />Issue Prescription
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
