'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, StatCard, Spinner, EmptyState, AlertBanner } from '@/components/shared';
import {
  Stethoscope, Pill, Heart, Lock, CheckCircle, Star, Video,
  MessageCircle, Send, Clock, Calendar, ChevronRight, Crown,
  User, Phone, X, FileText, AlertTriangle, Sparkles
} from 'lucide-react';
import { cn, formatDate, timeAgo } from '@/utils';
import toast from 'react-hot-toast';

// ─── Plan gating config ─────────────────────────────────────────────────────
const CONSULTATION_TYPES = [
  {
    type: 'pharmacist',
    title: 'Pharmacist Consultation',
    description: 'Get expert advice on medications, drug interactions, and dosage from a licensed pharmacist.',
    icon: Pill,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    fee: '$10',
    duration: '15–20 min',
    requiredPlan: 'basic',
    available24h: true,
  },
  {
    type: 'nurse',
    title: 'Nurse Consultation',
    description: 'Consult a registered nurse for health guidance, symptom assessment, and care planning.',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/10',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    fee: '$15',
    duration: '20–30 min',
    requiredPlan: 'pro',
    available24h: false,
  },
  {
    type: 'doctor',
    title: 'Doctor Consultation',
    description: 'Connect with a licensed physician for diagnosis, treatment plans, and digital prescriptions.',
    icon: Stethoscope,
    color: 'from-blue-500 to-pharma-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    fee: '$25',
    duration: '30–45 min',
    requiredPlan: 'pro',
    available24h: false,
  },
] as const;

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  basic: { label: 'Basic (Free)', color: 'text-muted-foreground' },
  pro: { label: 'Pro — $19.99/mo', color: 'text-blue-600' },
  enterprise: { label: 'Enterprise — $49.99/mo', color: 'text-purple-600' },
};

export function ConsultationBookingPage() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'details' | 'session'>('select');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'enterprise'>('pro');
  const [activeCons, setActiveCons] = useState<any>(null);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [booking, setBooking] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    chiefComplaint: '',
    symptoms: [] as string[],
    severity: 5,
    channel: 'chat' as 'video' | 'audio' | 'chat',
    customSymptom: '',
  });

  // Subscription & feature gate
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscription');
      return (await res.json()).data;
    },
  });

  // Existing consultations
  const { data: consultationsData } = useQuery({
    queryKey: ['my-consultations'],
    queryFn: async () => {
      const res = await fetch('/api/consultations?limit=10');
      return (await res.json()).data || [];
    },
    refetchInterval: activeCons ? 5000 : false,
  });

  // Available doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-available'],
    queryFn: async () => {
      const res = await fetch('/api/doctors?available=true&limit=6');
      return (await res.json()).data || [];
    },
  });

  const plan = subData?.plan || 'basic';
  const features = subData?.features || {};

  const canAccess = (requiredPlan: string) => {
    if (requiredPlan === 'basic') return true;
    if (requiredPlan === 'pro') return ['pro', 'enterprise'].includes(plan);
    if (requiredPlan === 'enterprise') return plan === 'enterprise';
    return false;
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { if (activeCons) scrollToBottom(); }, [activeCons?.messages]);

  const handleSelectType = (type: any) => {
    const typeConfig = CONSULTATION_TYPES.find(t => t.type === type.type);
    if (!typeConfig) return;
    if (!canAccess(typeConfig.requiredPlan)) {
      setUpgradePlan('pro');
      setUpgradeOpen(true);
      return;
    }
    setSelectedType(type.type);
    setStep('details');
  };

  const handleBook = async () => {
    if (!form.chiefComplaint.trim()) { toast.error('Please describe your chief complaint'); return; }
    setBooking(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationType: selectedType,
          chiefComplaint: form.chiefComplaint,
          symptoms: form.symptoms,
          severity: form.severity,
          channel: form.channel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Consultation booked! Connecting you now...');
        setActiveCons(data.data);
        setStep('session');
        qc.invalidateQueries({ queryKey: ['my-consultations'] });
      } else {
        if (res.status === 403) {
          setUpgradeOpen(true);
          toast.error(data.error);
        } else {
          toast.error(data.error || 'Booking failed');
        }
      }
    } catch { toast.error('Network error'); }
    finally { setBooking(false); }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeCons || sending) return;
    const content = msgInput;
    setMsgInput('');
    setSending(true);
    try {
      const res = await fetch(`/api/consultations/${activeCons._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { content, type: 'text' } }),
      });
      const data = await res.json();
      if (data.success) setActiveCons(data.data);
    } catch { toast.error('Send failed'); }
    finally { setSending(false); }
  };

  const endConsultation = async () => {
    if (!activeCons) return;
    await fetch(`/api/consultations/${activeCons._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    toast.success('Consultation ended');
    setActiveCons(null);
    setStep('select');
    setSelectedType(null);
    qc.invalidateQueries({ queryKey: ['my-consultations'] });
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: upgradePlan }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Upgraded to ${upgradePlan.toUpperCase()} plan!`);
        qc.invalidateQueries({ queryKey: ['subscription'] });
        setUpgradeOpen(false);
      } else toast.error(data.error);
    } catch { toast.error('Upgrade failed'); }
    finally { setUpgrading(false); }
  };

  // ─── Session UI ──────────────────────────────────────────────
  if (step === 'session' && activeCons) {
    const provider = activeCons.doctorId || activeCons.pharmacistId || activeCons.nurseId;
    const messages = activeCons.messages || [];

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}>
          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-4 border-b bg-gradient-to-r from-pharma-500/10 to-blue-500/10">
            <div className="w-10 h-10 rounded-full bg-pharma-500/20 flex items-center justify-center font-bold text-pharma-600">
              {provider?.name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{provider?.name || 'Connecting provider...'}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeCons.consultationType} consultation · {activeCons.status}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeCons.channel === 'video' && (
                <button className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-colors">
                  <Video className="w-4 h-4" />
                </button>
              )}
              <button onClick={endConsultation} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chief complaint banner */}
          <div className="px-5 py-3 bg-muted/40 border-b text-xs text-muted-foreground">
            <span className="font-medium">Chief Complaint:</span> {activeCons.chiefComplaint}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Consultation started. A healthcare provider will join shortly.</p>
                <p className="text-xs mt-1 opacity-60">Feel free to describe your symptoms in detail.</p>
              </div>
            )}
            {messages.map((msg: any, i: number) => {
              const isMe = msg.senderRole === 'consumer';
              return (
                <div key={i} className={cn('flex gap-3', isMe ? 'flex-row-reverse' : '')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', isMe ? 'bg-pharma-500 text-white' : 'bg-muted')}>
                    {isMe ? 'Me' : (msg.senderRole?.[0]?.toUpperCase() || 'P')}
                  </div>
                  <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-pharma-500 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm')}>
                    {msg.content}
                    <div className={cn('text-xs mt-1 opacity-60', isMe ? 'text-right' : '')}>
                      {timeAgo(msg.sentAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Describe your symptoms or ask a question..."
                className="flex-1 input-field py-2.5"
              />
              <button onClick={sendMessage} disabled={!msgInput.trim() || sending}
                className="btn-primary px-4 py-2.5 disabled:opacity-50">
                {sending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Details form ────────────────────────────────────────────
  if (step === 'details') {
    const typeConfig = CONSULTATION_TYPES.find(t => t.type === selectedType)!;
    const QUICK_SYMPTOMS = ['Fever', 'Headache', 'Nausea', 'Fatigue', 'Cough', 'Pain', 'Dizziness', 'Rash'];

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('select')} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <h1 className="font-display text-2xl font-bold">{typeConfig.title}</h1>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold mb-2 block">Chief Complaint <span className="text-red-500">*</span></label>
            <textarea
              value={form.chiefComplaint}
              onChange={e => setForm(p => ({ ...p, chiefComplaint: e.target.value }))}
              placeholder="Briefly describe the main reason for your consultation..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Symptoms</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_SYMPTOMS.map(s => (
                <button key={s} type="button"
                  onClick={() => setForm(p => ({ ...p, symptoms: p.symptoms.includes(s) ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s] }))}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    form.symptoms.includes(s) ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:bg-muted'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Severity: {form.severity}/10</label>
            <input type="range" min={1} max={10} value={form.severity}
              onChange={e => setForm(p => ({ ...p, severity: +e.target.value }))}
              className="w-full accent-pharma-500" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Mild</span><span>Moderate</span><span>Severe</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Consultation Channel</label>
            <div className="grid grid-cols-3 gap-3">
              {[['chat', 'Chat', MessageCircle], ['audio', 'Voice Call', Phone], ['video', 'Video Call', Video]] .map(([val, label, Icon]: any) => (
                <button key={val} type="button"
                  onClick={() => setForm(p => ({ ...p, channel: val }))}
                  className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium',
                    form.channel === val ? 'border-pharma-500 bg-pharma-500/10 text-pharma-600' : 'border-border hover:border-pharma-300'
                  )}>
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4 text-sm">
            <span className="text-muted-foreground">Consultation fee:</span>
            <span className="font-bold text-lg text-pharma-600">{typeConfig.fee}</span>
          </div>

          <button onClick={handleBook} disabled={booking || !form.chiefComplaint.trim()}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 text-base">
            {booking ? <Spinner size="sm" /> : <Stethoscope className="w-5 h-5" />}
            {booking ? 'Connecting...' : 'Start Consultation'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Selection screen ─────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Consultations"
        subtitle="Connect with licensed healthcare professionals — available in minutes"
      />

      {/* Plan badge */}
      {!subLoading && (
        <div className={cn('flex items-center gap-2 mb-6 text-sm px-4 py-2.5 rounded-xl border w-fit',
          plan === 'basic' ? 'bg-muted/50 border-border' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        )}>
          <Crown className={cn('w-4 h-4', plan === 'basic' ? 'text-muted-foreground' : 'text-blue-500')} />
          <span className="font-medium capitalize">Current Plan: {plan.toUpperCase()}</span>
          {plan === 'basic' && (
            <button onClick={() => setUpgradeOpen(true)} className="ml-2 text-pharma-500 font-semibold hover:underline text-xs">
              Upgrade →
            </button>
          )}
        </div>
      )}

      {/* Consultation type cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {CONSULTATION_TYPES.map(ct => {
          const Icon = ct.icon;
          const locked = !canAccess(ct.requiredPlan);
          return (
            <div
              key={ct.type}
              onClick={() => handleSelectType(ct)}
              className={cn('bg-card border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200',
                locked ? 'opacity-80 hover:opacity-100' : 'hover:shadow-xl hover:-translate-y-1',
                'group'
              )}
            >
              {/* Gradient top stripe */}
              <div className={cn('h-1.5 bg-gradient-to-r', ct.color)} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', ct.bg)}>
                    <Icon className={cn('w-6 h-6', ct.text)} />
                  </div>
                  {locked ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                      <Lock className="w-3 h-3" /> PRO
                    </span>
                  ) : (
                    ct.available24h && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Available now
                      </span>
                    )
                  )}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{ct.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{ct.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ct.duration}</span>
                  </div>
                  <span className={cn('font-bold text-lg', ct.text)}>{ct.fee}</span>
                </div>
                <button className={cn('mt-4 w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                  locked
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800'
                    : `${ct.bg} ${ct.text} hover:opacity-80 border ${ct.border}`
                )}>
                  {locked ? <><Lock className="w-3.5 h-3.5" />Unlock with PRO</> : <><ChevronRight className="w-4 h-4" />Book Consultation</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available doctors */}
      {doctorsData?.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl mb-4">Available Doctors Now</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctorsData.slice(0, 6).map((doc: any) => (
              <div key={doc._id} className="bg-card border rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {doc.userId?.name?.[0] || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">Dr. {doc.userId?.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.specialization?.slice(0, 2).join(', ')}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs">{doc.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-xs text-muted-foreground">· {doc.experience}yr exp</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-blue-600">${doc.consultationFee}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past consultations */}
      {consultationsData?.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl mb-4">Past Consultations</h2>
          <div className="space-y-3">
            {consultationsData.slice(0, 5).map((cons: any) => (
              <div key={cons._id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm capitalize">{cons.consultationType} Consultation</div>
                  <div className="text-xs text-muted-foreground truncate">{cons.chiefComplaint}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(cons.createdAt)}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn('badge-status text-xs capitalize',
                    cons.status === 'completed' ? 'bg-green-100 text-green-700' :
                    cons.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  )}>
                    {cons.status?.replace('_', ' ')}
                  </span>
                  {cons.prescriptionId && (
                    <span className="text-xs text-pharma-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" />Prescription issued
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-pharma-600 p-6 text-white text-center">
              <Crown className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h2 className="font-display text-2xl font-bold mb-1">Upgrade Your Plan</h2>
              <p className="text-white/80 text-sm">Unlock doctor & nurse consultations plus premium features</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { plan: 'pro' as const, price: '$19.99/mo', features: ['Doctor consultations', 'Nurse consultations', 'Video & voice calls', '10 consultations/month', 'Telemedicine'] },
                { plan: 'enterprise' as const, price: '$49.99/mo', features: ['Everything in Pro', 'Unlimited consultations', 'Priority support', 'Dedicated pharmacist', 'Family accounts'] },
              ].map(p => (
                <button key={p.plan} onClick={() => setUpgradePlan(p.plan)}
                  className={cn('w-full text-left p-4 rounded-2xl border-2 transition-all',
                    upgradePlan === p.plan ? 'border-pharma-500 bg-pharma-500/5' : 'border-border hover:border-pharma-300'
                  )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold capitalize">{p.plan} Plan</span>
                    <span className="font-bold text-pharma-600">{p.price}</span>
                  </div>
                  <ul className="space-y-1">
                    {p.features.map(f => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setUpgradeOpen(false)} className="flex-1 py-3 border rounded-xl text-sm hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleUpgrade} disabled={upgrading}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                  {upgrading ? <Spinner size="sm" /> : <Crown className="w-4 h-4" />}
                  {upgrading ? 'Upgrading...' : `Upgrade to ${upgradePlan.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
