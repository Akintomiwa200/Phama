'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader, StatCard, AlertBanner } from '@/components/shared';
import {
  Map, ScanLine, Stethoscope, ShoppingCart, Heart, Truck,
  MessageCircle, Send, Bot, User, Pill, X, Activity
} from 'lucide-react';
import { cn } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ChatMsg { role: 'user' | 'assistant'; content: string }

const QUICK_ACTIONS = [
  { href: '/consumer/body-map', icon: Map, label: '3D Body Map', desc: 'Click your pain area', color: 'bg-blue-500/10 text-blue-600' },
  { href: '/consumer/scanner', icon: ScanLine, label: 'Drug Scanner', desc: 'Scan any medication', color: 'bg-purple-500/10 text-purple-600' },
  { href: '/consumer/symptoms', icon: Stethoscope, label: 'Log Symptoms', desc: 'Track how you feel', color: 'bg-emerald-500/10 text-emerald-600' },
  { href: '/consumer/pharmacy', icon: Pill, label: 'Find Pharmacy', desc: 'Nearest pharmacies', color: 'bg-orange-500/10 text-orange-600' },
  { href: '/consumer/orders', icon: Truck, label: 'My Orders', desc: 'Track deliveries', color: 'bg-cyan-500/10 text-cyan-600' },
  { href: '/consumer/health-history', icon: Heart, label: 'Health History', desc: 'Past visits & meds', color: 'bg-pink-500/10 text-pink-600' },
];

export function ConsumerHome() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hello! I'm your AI Pharmacist assistant. Ask me about medications, dosages, drug interactions, or any health questions." }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const { data: recentOrders } = useQuery({
    queryKey: ['consumer-recent-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders?limit=3');
      const data = await res.json();
      return data.data || [];
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      }
    } catch {
      toast.error('Chat failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Welcome back 👋"
        subtitle="Your personal health & pharmacy companion"
        actions={
          <button
            onClick={() => setChatOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Ask AI Pharmacist
          </button>
        }
      />

      {/* Alert */}
      <div className="mb-6">
        <AlertBanner
          type="info"
          message="⚠️ AI recommendations are informational only. Always consult a licensed pharmacist or doctor before taking medication."
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.href} href={a.href}
            className="bg-card border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-3', a.color)}>
              <a.icon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm mb-0.5">{a.label}</div>
            <div className="text-xs text-muted-foreground">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Prescriptions" value={2} icon={<Pill className="w-4 h-4" />} color="blue" />
        <StatCard label="Orders This Month" value={4} icon={<ShoppingCart className="w-4 h-4" />} color="green" />
        <StatCard label="Symptom Logs" value={7} icon={<Activity className="w-4 h-4" />} color="purple" />
      </div>

      {/* Recent orders */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Recent Orders</h2>
            <Link href="/consumer/orders" className="text-sm text-pharma-500 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div key={order._id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium">#{order.orderNumber}</div>
                  <div className="text-xs text-muted-foreground">{order.items?.length} item(s)</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">${order.total?.toFixed(2)}</div>
                  <span className="text-xs capitalize text-pharma-500">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-card border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden" style={{ height: 520 }}>
          <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-pharma-600 to-pharma-500 text-white rounded-t-2xl">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">AI Pharmacist</div>
              <div className="text-xs opacity-75">Powered by Claude AI</div>
            </div>
            <button onClick={() => setChatOpen(false)} className="opacity-75 hover:opacity-100 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold', msg.role === 'user' ? 'bg-pharma-500 text-white' : 'bg-muted text-muted-foreground')}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={cn('max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed', msg.role === 'user' ? 'bg-pharma-500 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm')}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about medications..."
                className="input-field flex-1 py-2"
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending} className="btn-primary px-3 py-2 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
