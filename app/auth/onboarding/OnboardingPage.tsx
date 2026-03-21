'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Pill, CheckCircle, ChevronRight, User, Heart, Bell, Shield, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/shared';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const COMMON_ALLERGIES = ['Penicillin', 'Aspirin', 'Ibuprofen', 'Sulfa drugs', 'Codeine', 'Latex', 'Nuts', 'Shellfish'];
const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'Arthritis', 'Depression', 'Anxiety', 'Thyroid disorder'];

interface StepProps { onNext: () => void; onSkip?: () => void; }

export function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    dateOfBirth: '',
    bloodType: '',
    weight: '',
    height: '',
    allergies: [] as string[],
    conditions: [] as string[],
    currentMedications: '',
    emergencyName: '',
    emergencyPhone: '',
  });

  const toggleArr = (field: 'allergies' | 'conditions', val: string) => {
    setProfile(p => ({
      ...p,
      [field]: p[field].includes(val) ? p[field].filter(x => x !== val) : [...p[field], val],
    }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const userId = (session?.user as any)?.id;
      if (userId) {
        await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            healthProfile: {
              dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
              bloodType: profile.bloodType,
              weight: profile.weight ? Number(profile.weight) : undefined,
              height: profile.height ? Number(profile.height) : undefined,
              allergies: profile.allergies,
              conditions: profile.conditions,
              currentMedications: profile.currentMedications.split(',').map(s => s.trim()).filter(Boolean),
              emergencyContact: profile.emergencyName ? { name: profile.emergencyName, phone: profile.emergencyPhone } : undefined,
            },
          }),
        });
      }
      toast.success('Profile set up successfully!');
      router.push('/consumer/home');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const user = session?.user as any;
  const role = user?.role;

  const STEPS = [
    { title: 'Welcome!', icon: Sparkles, color: 'from-pharma-500 to-pharma-600' },
    { title: 'Basic Info', icon: User, color: 'from-blue-500 to-blue-600' },
    { title: 'Health Profile', icon: Heart, color: 'from-pink-500 to-rose-600' },
    { title: 'Allergies & Conditions', icon: Shield, color: 'from-orange-500 to-amber-600' },
    { title: 'All Set!', icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
  ];

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all duration-500', i <= step ? 'bg-pharma-500' : 'bg-muted')} />
          ))}
        </div>

        {/* Step icon */}
        <div className="text-center mb-8">
          <div className={cn('w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mx-auto mb-5 shadow-xl', currentStep.color)}>
            <StepIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{currentStep.title}</h1>
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Welcome to PharmaConnect, <strong>{user?.name?.split(' ')[0]}</strong>! 🎉
              <br />Let&apos;s set up your health profile to get personalized AI drug recommendations.
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['🤖', 'AI Recommendations', 'Personalized to you'], ['💊', 'Drug Safety', 'Allergy-aware'], ['📋', 'Health History', 'Track everything']].map(([icon, title, desc]) => (
                <div key={title} className="bg-card border rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="font-semibold text-xs mb-0.5">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setStep(1)} className="btn-primary py-3.5 text-base">Get Started <ChevronRight className="w-5 h-5 inline ml-1" /></button>
              <button onClick={() => router.push(role === 'consumer' ? '/consumer/home' : '/retailer/dashboard')} className="text-sm text-muted-foreground hover:text-foreground py-2">Skip for now</button>
            </div>
          </div>
        )}

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-muted-foreground text-center mb-6">This helps us give you age-appropriate dosage recommendations.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date of Birth</label>
                <input type="date" value={profile.dateOfBirth} onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Blood Type</label>
                <select value={profile.bloodType} onChange={e => setProfile(p => ({ ...p, bloodType: e.target.value }))} className="input-field">
                  <option value="">Select</option>
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Weight (kg)</label>
                <input type="number" value={profile.weight} onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))} placeholder="70" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Height (cm)</label>
                <input type="number" value={profile.height} onChange={e => setProfile(p => ({ ...p, height: e.target.value }))} placeholder="175" className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="flex-1 py-3 border rounded-xl hover:bg-muted transition-colors">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 btn-primary py-3">Continue</button>
            </div>
          </div>
        )}

        {/* Step 2 — Allergies */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-muted-foreground text-center mb-2">Select any known drug allergies. This prevents dangerous recommendations.</p>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-red-600 dark:text-red-400">⚠️ Drug Allergies</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_ALLERGIES.map(a => (
                  <button type="button" key={a} onClick={() => toggleArr('allergies', a)}
                    className={cn('px-3 py-1.5 rounded-full text-sm border transition-all',
                      profile.allergies.includes(a) ? 'bg-red-500 text-white border-red-500' : 'border-border hover:border-red-300'
                    )}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-orange-600 dark:text-orange-400">🏥 Pre-existing Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {COMMON_CONDITIONS.map(c => (
                  <button type="button" key={c} onClick={() => toggleArr('conditions', c)}
                    className={cn('px-3 py-1.5 rounded-full text-sm border transition-all',
                      profile.conditions.includes(c) ? 'bg-orange-500 text-white border-orange-500' : 'border-border hover:border-orange-300'
                    )}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Current Medications <span className="text-muted-foreground font-normal">(comma-separated)</span></label>
              <input value={profile.currentMedications} onChange={e => setProfile(p => ({ ...p, currentMedications: e.target.value }))} placeholder="Metformin, Lisinopril..." className="input-field" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-xl hover:bg-muted transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 — Emergency Contact */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-muted-foreground text-center mb-6">Add an emergency contact for critical health situations.</p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Emergency Contact Name</label>
              <input value={profile.emergencyName} onChange={e => setProfile(p => ({ ...p, emergencyName: e.target.value }))} placeholder="Full name" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Emergency Contact Phone</label>
              <input type="tel" value={profile.emergencyPhone} onChange={e => setProfile(p => ({ ...p, emergencyPhone: e.target.value }))} placeholder="+1 234 567 890" className="input-field" />
            </div>
            <div className="bg-pharma-500/5 border border-pharma-500/20 rounded-2xl p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-pharma-600 font-medium mb-1.5"><Shield className="w-4 h-4" />Your data is private & secure</div>
              Your health information is encrypted and never shared with third parties. Only accessible by you and pharmacists you authorize.
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border rounded-xl hover:bg-muted transition-colors">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 btn-primary py-3">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4 — Complete */}
        {step === 4 && (
          <div className="text-center space-y-6">
            <p className="text-muted-foreground text-lg">Your health profile is ready. PharmaConnect will now give you personalized, safe drug recommendations tailored to your unique health profile.</p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-left space-y-2 text-sm">
              {[
                profile.dateOfBirth && '✓ Age-appropriate dosing enabled',
                profile.allergies.length > 0 && `✓ ${profile.allergies.length} allergy alert(s) set`,
                profile.conditions.length > 0 && `✓ ${profile.conditions.length} condition(s) tracked`,
                profile.currentMedications && '✓ Drug interaction checking active',
                profile.emergencyName && '✓ Emergency contact saved',
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="text-emerald-700 dark:text-emerald-400">{item}</div>
              ))}
            </div>
            <button onClick={handleComplete} disabled={saving} className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Spinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
              {saving ? 'Setting up...' : 'Enter PharmaConnect'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
