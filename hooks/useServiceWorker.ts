'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('[SW] Registered:', reg.scope);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — could show a toast here
                console.log('[SW] New version available');
              }
            });
          });
        } catch (err) {
          console.warn('[SW] Registration failed:', err);
        }
      });
    }
  }, []);
}

export async function requestPushPermission(): Promise<PushSubscription | null> {
  if (!('Notification' in window) || !('PushManager' in window)) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
  return sub;
}

export async function registerBackgroundSync(tag = 'sync-offline-actions') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await (reg as any).sync.register(tag);
  }
}
