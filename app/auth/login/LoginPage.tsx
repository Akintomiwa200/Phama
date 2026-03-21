'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Pill, Eye, EyeOff, Mail, Lock, AlertCircle, Chrome } from 'lucide-react';
import { Spinner } from '@/components/shared';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/consumer/home';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        toast.success('Welcome back!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl });
  };

  const DEMO_ACCOUNTS = [
    { label: 'Super Admin', email: 'admin@pharmaconnect.com', password: 'Admin@123', color: 'text-red-500' },
    { label: 'Wholesaler', email: 'wholesale@pharmaconnect.com', password: 'Demo@123', color: 'text-blue-500' },
    { label: 'Retailer', email: 'retail@pharmaconnect.com', password: 'Demo@123', color: 'text-emerald-500' },
    { label: 'Consumer', email: 'consumer@pharmaconnect.com', password: 'Demo@123', color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pharma-900 via-pharma-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Bg decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-pharma-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pharma-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pharma-400 to-pharma-600 flex items-center justify-center shadow-lg shadow-pharma-500/30">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">PharmaConnect</span>
          </div>
          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            The smarter way to manage pharmacy
          </h1>
          <p className="text-pharma-200 text-lg leading-relaxed">
            Connect wholesalers, retailers, and consumers in one intelligent platform — powered by AI drug intelligence and real-time insights.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { icon: '🏭', label: 'Wholesalers', desc: 'Manage bulk supply chain' },
            { icon: '🏪', label: 'Pharmacies', desc: 'Full POS & inventory' },
            { icon: '👤', label: 'Consumers', desc: 'AI health companion' },
            { icon: '🤖', label: 'AI-Powered', desc: 'Smart recommendations' },
          ].map(item => (
            <div key={item.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-white font-semibold text-sm">{item.label}</div>
              <div className="text-pharma-300 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-pharma-500 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">PharmaConnect</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-6 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium">Password</label>
                <a href="#" className="text-xs text-pharma-500 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t" />
          </div>

          <button onClick={handleGoogle} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 py-3 border rounded-xl hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50">
            {googleLoading ? <Spinner size="sm" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-pharma-500 font-medium hover:underline">Create account</Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 p-4 bg-muted/50 rounded-2xl border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.label}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="text-left p-2.5 rounded-xl hover:bg-card transition-colors border border-transparent hover:border-border"
                >
                  <div className={cn('text-xs font-semibold', acc.color)}>{acc.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
