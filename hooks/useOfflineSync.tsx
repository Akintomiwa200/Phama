'use client';

import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────
// Offline queue store
// ─────────────────────────────────────────────
interface PendingAction {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
  retries: number;
  description: string;
}

interface OfflineStore {
  isOnline: boolean;
  pendingActions: PendingAction[];
  setOnline: (v: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>) => void;
  removePendingAction: (id: string) => void;
  clearPending: () => void;
}                                         

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set) => ({
      isOnline: true,
      pendingActions: [],
      setOnline: (isOnline) => set({ isOnline }),
      addPendingAction: (action) => set((s) => ({
        pendingActions: [
          ...s.pendingActions,
          { ...action, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: Date.now(), retries: 0 },
        ],
      })),
      removePendingAction: (id) => set((s) => ({ pendingActions: s.pendingActions.filter(a => a.id !== id) })),
      clearPending: () => set({ pendingActions: [] }),
    }),
    { name: 'pharma-offline-queue' }
  )
);

// ─────────────────────────────────────────────
// IndexedDB cache
// ─────────────────────────────────────────────
const DB_NAME = 'pharmaconnect-cache';
const DB_VERSION = 1;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('symplogs')) {
        db.createObjectStore('symplogs', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheSet(key: string, value: unknown, ttl = 3600000) {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ key, value, expiresAt: Date.now() + ttl });
  } catch (e) { console.warn('[Cache] Set failed:', e); }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readonly');
      const req = tx.objectStore('cache').get(key);
      req.onsuccess = () => {
        const record = req.result;
        if (!record || record.expiresAt < Date.now()) { resolve(null); return; }
        resolve(record.value as T);
      };
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function saveOfflineSymptomLog(log: Record<string, unknown>) {
  try {
    const db = await openDB();
    const tx = db.transaction('symplogs', 'readwrite');
    tx.objectStore('symplogs').add({ ...log, savedAt: Date.now(), synced: false });
  } catch (e) { console.warn('[Offline] Save failed:', e); }
}

export async function getUnsynedSymptomLogs(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('symplogs', 'readonly');
      const req = tx.objectStore('symplogs').getAll();
      req.onsuccess = () => resolve((req.result || []).filter((r: any) => !r.synced));
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

// ─────────────────────────────────────────────
// Main offline sync hook
// ─────────────────────────────────────────────
export function useOfflineSync() {
  const { isOnline, setOnline, pendingActions, removePendingAction, addPendingAction } = useOfflineStore();
  const syncInProgress = useRef(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      syncPendingActions();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync unsynced symptom logs when back online
  const syncOfflineSymptomLogs = useCallback(async () => {
    const unsyncedLogs = await getUnsynedSymptomLogs();
    for (const log of unsyncedLogs) {
      try {
        await fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log),
        });
        // Mark as synced in IndexedDB
        const db = await openDB();
        const tx = db.transaction('symplogs', 'readwrite');
        tx.objectStore('symplogs').put({ ...log, synced: true });
      } catch { /* retry next time */ }
    }
  }, []);

  // Replay queued API calls
  const syncPendingActions = useCallback(async () => {
    if (syncInProgress.current || pendingActions.length === 0) return;
    syncInProgress.current = true;

    for (const action of pendingActions) {
      try {
        const res = await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: action.body,
        });
        if (res.ok) {
          removePendingAction(action.id);
          console.log(`[Offline Sync] Replayed: ${action.description}`);
        }
      } catch { /* keep in queue */ }
    }
    await syncOfflineSymptomLogs();
    syncInProgress.current = false;
  }, [pendingActions, removePendingAction, syncOfflineSymptomLogs]);

  // Offline-aware fetch wrapper
  const offlineFetch = useCallback(async (
    url: string,
    options: RequestInit & { description?: string; fallbackCache?: string } = {}
  ): Promise<Response | { ok: false; queued: true; data: null }> => {
    const { description = 'API Call', fallbackCache, ...fetchOptions } = options;

    if (!isOnline) {
      // Try to serve from cache
      if (fallbackCache) {
        const cached = await cacheGet(fallbackCache);
        if (cached) {
          return new Response(JSON.stringify({ success: true, data: cached, fromCache: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      // Queue mutating actions
      if (options.method && options.method !== 'GET') {
        addPendingAction({ url, method: options.method, body: options.body as string, description });
        console.log(`[Offline] Queued: ${description}`);
      }
      return { ok: false, queued: true, data: null };
    }

    const res = await fetch(url, fetchOptions);
    // Cache GET responses
    if (fetchOptions.method === 'GET' || !fetchOptions.method) {
      if (res.ok && fallbackCache) {
        const clone = res.clone();
        const data = await clone.json();
        await cacheSet(fallbackCache, data?.data || data, 1800000); // 30 min TTL
      }
    }
    return res;
  }, [isOnline, addPendingAction]);

  return { isOnline, pendingActions: pendingActions.length, offlineFetch, syncPendingActions };
}

// ─────────────────────────────────────────────
// Offline indicator component
// ─────────────────────────────────────────────
export function OfflineIndicator() {
  const isOnline = useOfflineStore(s => s.isOnline);
  const pendingActions = useOfflineStore(s => s.pendingActions.length);

  if (isOnline && pendingActions === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg border ${
        isOnline
          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
      {isOnline
        ? `Syncing ${pendingActions} pending action${pendingActions !== 1 ? 's' : ''}...`
        : `You're offline — ${pendingActions} action${pendingActions !== 1 ? 's' : ''} will sync when reconnected`}
    </div>
  );
}
