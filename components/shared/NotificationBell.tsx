'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCheck, Package, Truck, Pill, AlertTriangle, Sparkles, Info } from 'lucide-react';
import { cn, timeAgo } from '@/utils';

const TYPE_ICONS: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  order: { icon: Package, color: 'text-blue-500 bg-blue-500/10' },
  delivery: { icon: Truck, color: 'text-orange-500 bg-orange-500/10' },
  prescription: { icon: Pill, color: 'text-purple-500 bg-purple-500/10' },
  low_stock: { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-500/10' },
  expiry: { icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
  ai: { icon: Sparkles, color: 'text-pharma-500 bg-pharma-500/10' },
  system: { icon: Info, color: 'text-muted-foreground bg-muted' },
};

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=15');
      return (await res.json()).data;
    },
    refetchInterval: 30000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-muted transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-pharma-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-pharma-500 hover:underline flex items-center gap-1 px-2 py-1">
                    <CheckCheck className="w-3.5 h-3.5" /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif: any) => {
                  const typeConfig = TYPE_ICONS[notif.type] || TYPE_ICONS.system;
                  const Icon = typeConfig.icon;
                  return (
                    <div
                      key={notif._id}
                      onClick={() => { if (!notif.isRead) markRead(notif._id); }}
                      className={cn('flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0', !notif.isRead && 'bg-pharma-500/5')}
                    >
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', typeConfig.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm leading-tight', !notif.isRead && 'font-semibold')}>{notif.title}</p>
                          {!notif.isRead && <div className="w-2 h-2 bg-pharma-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
