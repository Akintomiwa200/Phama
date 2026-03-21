'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { OfflineIndicator, useOfflineStore } from '@/hooks/useOfflineSync';

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production') {
        navigator.serviceWorker.getRegistrations()
          .then(registrations => Promise.all(registrations.map(reg => reg.unregister())))
          .catch(() => undefined);
      } else {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(reg => console.log('[SW] Registered:', reg.scope))
          .catch(err => console.warn('[SW] Registration failed:', err));
      }
    }
    const store = useOfflineStore.getState();
    const handleOnline = () => store.setOnline(true);
    const handleOffline = () => store.setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    store.setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
      },
    })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ServiceWorkerRegistrar />
        {children}
        <OfflineIndicator />
      </QueryClientProvider>
    </SessionProvider>
  );
}
