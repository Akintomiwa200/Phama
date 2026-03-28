'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Pill, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle,
  Sparkles,
  Shield,
  ArrowRight
} from 'lucide-react';
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
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    phone: '', 
    role: 'consumer' 
  });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { 
      setError('Passwords do not match'); 
      return; 
    }
    if (form.password.length < 8) { 
      setError('Password must be at least 8 characters'); 
      return; 
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          password: form.password, 
          phone: form.phone, 
          role: form.role 
        }),
      });
      const data = await res.json();
      if (!data.success) { 
        setError(data.error || 'Registration failed'); 
        return; 
      }

      // Auto sign-in
      const result = await signIn('credentials', { 
        email: form.email, 
        password: form.password, 
        redirect: false 
      });
      
      if (result?.error) { 
        router.push('/auth/login'); 
        return; 
      }
      
      toast.success('Account created! Welcome to PharmaConnect 🎉');
      router.push('/auth/onboarding');
    } catch { 
      setError('Something went wrong. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
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
    <div className="min-h-screen bg-white flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-white text-xl">pharma<span className="text-emerald-300">connect</span></span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-medium text-white">Join the future of healthcare</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Join thousands of healthcare professionals
            </h2>
            
            <p className="text-emerald-100 text-base leading-relaxed mb-10">
              Whether you're a consumer, pharmacist, or doctor — PharmaConnect has the tools you need to transform healthcare delivery.
            </p>
          </motion.div>
          
          <div className="space-y-3">
            {[
              'AI-powered drug recommendations',
              'Real-time inventory management',
              '3D symptom body mapping',
              'End-to-end prescription tracking',
              'Enterprise-grade security',
            ].map((feature, idx) => (
              <motion.div 
                key={feature} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-100 text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">pharma<span className="text-emerald-600">connect</span></span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map(s => (
                <div 
                  key={s} 
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300', 
                    step >= s ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gray-200'
                  )} 
                />
              ))}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              {step === 1 ? 'Choose your role' : 'Create your account'}
            </h2>
            <p className="text-gray-500 text-sm">Step {step} of 2</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-6 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {ROLE_OPTIONS.map((opt, idx) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => { set('role', opt.value); setStep(2); }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-md group',
                    form.role === opt.value 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className={cn(
                      'font-semibold transition-colors',
                      form.role === opt.value ? 'text-emerald-700' : 'text-gray-900 group-hover:text-emerald-600'
                    )}>
                      {opt.label}
                    </div>
                    <div className="text-sm text-gray-500">{opt.desc}</div>
                  </div>
                  {form.role === opt.value && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => set('name', e.target.value)} 
                    placeholder="John Doe" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={e => set('email', e.target.value)} 
                    placeholder="you@example.com" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    value={form.phone} 
                    onChange={e => set('phone', e.target.value)} 
                    placeholder="+1 234 567 890" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type={showPw ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={e => set('password', e.target.value)} 
                    placeholder="Min. 8 characters" 
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                    required 
                    minLength={8} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div 
                          key={i} 
                          className={cn('h-1 flex-1 rounded-full transition-all', i <= strength ? strengthColor : 'bg-gray-200')} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength: <span className="font-medium text-gray-700">{strengthLabel}</span>
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={e => set('confirmPassword', e.target.value)} 
                    placeholder="Repeat password" 
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                    required 
                  />
                  {form.confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {form.password === form.confirmPassword
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                  Privacy Policy
                </Link>.
              </p>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline transition-colors">
              Sign in
            </Link>
          </p>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>HIPAA compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Bank-grade security</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Free 14-day trial</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}