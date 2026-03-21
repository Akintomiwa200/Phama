'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Pill, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { Spinner } from '@/components/shared';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'consumer', label: 'Consumer / Patient', desc: 'Buy medications, track health', icon: '👤' },
  { value: 'pharmacist', label: 'Pharmacist', desc: 'Verify prescriptions, dispense', icon: '💊' },
  { value: 'doctor', label: 'Doctor', desc: 'Issue digital prescriptions', icon: '🩺' },
];

export function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'consumer' });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Registration failed'); return; }

      // Auto sign-in
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.error) { router.push('/auth/login'); return; }
      toast.success('Account created! Welcome to PharmaConnect 🎉');
      router.push('/auth/onboarding');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const passwordStrength = () => {
    const pw = form.password;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = passwordStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-400'][strength];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-pharma-900 to-emerald-900 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-pharma-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pharma-400 to-emerald-500 flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">PharmaConnect</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">Join thousands of healthcare professionals</h2>
          <p className="text-pharma-200 text-base leading-relaxed mb-10">
            Whether you&apos;re a consumer, pharmacist, or doctor — PharmaConnect has the tools you need.
          </p>
          {[
            'AI-powered drug recommendations',
            'Real-time inventory management',
            '3D symptom body mapping',
            'End-to-end prescription tracking',
            'Enterprise-grade security',
          ].map(f => (
            <div key={f} className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-pharma-200 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-pharma-500 flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">PharmaConnect</span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map(s => (
                <div key={s} className={cn('h-1.5 flex-1 rounded-full transition-all', step >= s ? 'bg-pharma-500' : 'bg-muted')} />
              ))}
            </div>
            <h2 className="font-display text-3xl font-bold mb-1">{step === 1 ? 'Choose your role' : 'Create your account'}</h2>
            <p className="text-muted-foreground text-sm">Step {step} of 2</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-6 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { set('role', opt.value); setStep(2); }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md',
                    form.role === opt.value ? 'border-pharma-500 bg-pharma-500/5' : 'border-border hover:border-pharma-300'
                  )}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-sm text-muted-foreground">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" className="input-field pl-10" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className="input-field pl-10" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 890" className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" className="input-field pl-10 pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => <div key={i} className={cn('h-1 flex-1 rounded-full', i <= strength ? strengthColor : 'bg-muted')} />)}
                    </div>
                    <p className="text-xs text-muted-foreground">Strength: <span className="font-medium">{strengthLabel}</span></p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" className="input-field pl-10" required />
                  {form.confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {form.password === form.confirmPassword
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-pharma-500 hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-pharma-500 hover:underline">Privacy Policy</a>.
              </p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border rounded-xl text-sm hover:bg-muted transition-colors">Back</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Spinner size="sm" /> : null}
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-pharma-500 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
