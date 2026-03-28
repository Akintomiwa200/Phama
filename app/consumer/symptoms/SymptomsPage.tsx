'use client'

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, EmptyState, Spinner } from '@/components/shared';
import { Stethoscope, Plus, CheckCircle, ChevronRight, Activity, X, Sparkles } from 'lucide-react';
import { cn, timeAgo, formatDate } from '@/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { BodyPart } from '@/types';

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Sore throat', 'Nausea',
  'Vomiting', 'Diarrhea', 'Stomach pain', 'Back pain', 'Joint pain',
  'Chest pain', 'Shortness of breath', 'Dizziness', 'Rash', 'Itching',
  'Loss of appetite', 'Chills', 'Runny nose', 'Congestion', 'Muscle aches',
  'Bloating', 'Heartburn', 'Palpitations', 'Swelling', 'Numbness',
];

const BODY_PARTS_SIMPLE: { key: BodyPart; label: string; emoji: string }[] = [
  { key: 'head', label: 'Head', emoji: '🧠' },
  { key: 'eyes', label: 'Eyes', emoji: '👁️' },
  { key: 'ears', label: 'Ears', emoji: '👂' },
  { key: 'nose', label: 'Nose', emoji: '👃' },
  { key: 'throat', label: 'Throat', emoji: '🫁' },
  { key: 'neck', label: 'Neck', emoji: '🦴' },
  { key: 'chest', label: 'Chest', emoji: '❤️' },
  { key: 'abdomen', label: 'Abdomen', emoji: '🫃' },
  { key: 'lower_back', label: 'Lower Back', emoji: '🔙' },
  { key: 'left_arm', label: 'Left Arm', emoji: '💪' },
  { key: 'right_arm', label: 'Right Arm', emoji: '💪' },
  { key: 'left_leg', label: 'Left Leg', emoji: '🦵' },
  { key: 'right_leg', label: 'Right Leg', emoji: '🦵' },
  { key: 'skin', label: 'Skin', emoji: '🩹' },
];

export function SymptomsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: recentLogs, isLoading } = useQuery({
    queryKey: ['symptoms-list'],
    queryFn: async () => {
      const res = await fetch('/api/symptoms?limit=10');
      return (await res.json()).data || [];
    },
  });

  const toggleBodyPart = (part: BodyPart) =>
    setBodyParts(p => p.includes(part) ? p.filter(x => x !== part) : [...p, part]);

  const toggleSymptom = (s: string) =>
    setSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const addCustom = () => {
    if (!customSymptom.trim()) return;
    if (!symptoms.includes(customSymptom.trim())) setSymptoms(p => [...p, customSymptom.trim()]);
    setCustomSymptom('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bodyParts.length) { toast.error('Select at least one body area'); return; }
    if (!symptoms.length) { toast.error('Select at least one symptom'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyParts, symptoms, severity, duration, description }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Symptoms logged and recommendations ready!');
        qc.invalidateQueries({ queryKey: ['symptoms-list'] });
        router.push('/consumer/body-map');
      } else toast.error(data.error);
    } catch { toast.error('Failed to log symptoms'); }
    finally { setSaving(false); }
  };

  const markResolved = async (id: string) => {
    await fetch('/api/symptoms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isResolved: true }) });
    qc.invalidateQueries({ queryKey: ['symptoms-list'] });
    toast.success('Marked as resolved');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Log Symptoms" subtitle="Track your symptoms and get AI-powered medication recommendations" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Body area */}
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pharma-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                Affected Body Area
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {BODY_PARTS_SIMPLE.map(bp => (
                  <button type="button" key={bp.key} onClick={() => toggleBodyPart(bp.key)}
                    className={cn('flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all',
                      bodyParts.includes(bp.key) ? 'bg-pharma-500/10 border-pharma-500 text-pharma-600 dark:text-pharma-400' : 'border-border hover:border-pharma-300 hover:bg-muted/50'
                    )}>
                    <span className="text-lg">{bp.emoji}</span>
                    <span>{bp.label}</span>
                  </button>
                ))}
              </div>
              {bodyParts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                  {bodyParts.map(bp => (
                    <span key={bp} className="flex items-center gap-1 text-xs bg-pharma-500/10 text-pharma-600 px-2.5 py-1 rounded-full">
                      {BODY_PARTS_SIMPLE.find(b => b.key === bp)?.label}
                      <button type="button" onClick={() => toggleBodyPart(bp)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Symptoms */}
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pharma-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                Select Symptoms
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_SYMPTOMS.map(s => (
                  <button type="button" key={s} onClick={() => toggleSymptom(s)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      symptoms.includes(s) ? 'bg-pharma-500 text-white border-pharma-500' : 'border-border hover:border-pharma-300 hover:bg-muted/50'
                    )}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                  placeholder="Add custom symptom..." className="input-field flex-1 py-2" />
                <button type="button" onClick={addCustom} className="btn-primary px-4 py-2 text-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Severity + duration */}
            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pharma-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                Severity & Duration
              </h3>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Pain/Discomfort Level</span>
                  <span className={cn('font-bold', severity >= 8 ? 'text-red-500' : severity >= 5 ? 'text-yellow-500' : 'text-emerald-500')}>
                    {severity}/10
                  </span>
                </div>
                <input type="range" min={1} max={10} value={severity} onChange={e => setSeverity(Number(e.target.value))} className="w-full accent-pharma-500" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Mild</span><span>Moderate</span><span>Severe</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Duration</label>
                <select value={duration} onChange={e => setDuration(e.target.value)} className="input-field">
                  <option value="">Select duration</option>
                  {['Less than 1 hour', 'A few hours', '1-2 days', '3-7 days', '1-2 weeks', 'More than 2 weeks', 'Chronic'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Additional Notes</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your symptoms in more detail..." rows={3} className="input-field resize-none" />
              </div>
            </div>

            <button type="submit" disabled={saving || !bodyParts.length || !symptoms.length}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Spinner size="sm" /> : <Sparkles className="w-5 h-5" />}
              {saving ? 'Analyzing...' : 'Log Symptoms & Get AI Recommendations'}
            </button>
          </form>
        </div>

        {/* Recent history */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg mb-4">Recent Logs</h3>
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !recentLogs?.length ? (
              <EmptyState icon={<Activity className="w-6 h-6" />} title="No logs yet" description="Your symptom history will appear here" />
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log._id} className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-wrap gap-1">
                        {log.symptoms?.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-xs bg-background px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {log.symptoms?.length > 2 && <span className="text-xs text-muted-foreground">+{log.symptoms.length - 2}</span>}
                      </div>
                      <span className={cn('text-xs font-bold ml-2 flex-shrink-0', log.severity >= 7 ? 'text-red-500' : log.severity >= 4 ? 'text-yellow-500' : 'text-emerald-500')}>
                        {log.severity}/10
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{timeAgo(log.loggedAt)}</div>
                    {!log.isResolved ? (
                      <button onClick={() => markResolved(log._id)} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Mark resolved
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Resolved</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick tip */}
          <div className="bg-pharma-500/5 border border-pharma-500/20 rounded-2xl p-5 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-pharma-500" />
              <span className="font-semibold text-sm text-pharma-600 dark:text-pharma-400">AI Tip</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For the most accurate recommendations, use the <strong>3D Body Map</strong> to visually select your affected areas and see drug recommendations visualized on screen.
            </p>
            <button onClick={() => router.push('/consumer/body-map')} className="mt-3 text-xs text-pharma-500 font-medium flex items-center gap-1 hover:underline">
              Open 3D Body Map <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
