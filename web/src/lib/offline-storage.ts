/**
 * Persistance locale (IndexedDB) pour consultation hors ligne des données essentielles.
 */

const DB_NAME = 'gs-offline-v1';
const STORE = 'kv';
const USER_KEY = 'snapshot:user';
const CONTEXT_STORAGE_KEY = 'offlineCacheContext';

let dbPromise: Promise<IDBDatabase> | null = null;
type OfflineCacheContext = {
  userId: string | null;
  role: string | null;
  schoolId: string | null;
};

let currentContext: OfflineCacheContext = {
  userId: null,
  role: null,
  schoolId: null,
};

function normalizeContext(partial?: Partial<OfflineCacheContext>): OfflineCacheContext {
  return {
    userId: partial?.userId ?? currentContext.userId ?? null,
    role: partial?.role ?? currentContext.role ?? null,
    schoolId: partial?.schoolId ?? currentContext.schoolId ?? null,
  };
}

function contextScope(ctx: OfflineCacheContext): string {
  const user = ctx.userId?.trim() || 'anon';
  const role = ctx.role?.trim().toUpperCase() || 'anon';
  const school = ctx.schoolId?.trim() || 'none';
  return `u:${user}|r:${role}|s:${school}`;
}

function scopedKey(baseKey: string): string {
  return `${contextScope(currentContext)}::${baseKey}`;
}

function loadContextFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<OfflineCacheContext>;
    currentContext = normalizeContext(parsed);
  } catch {
    /* ignore */
  }
}

function saveContextToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(currentContext));
  } catch {
    /* ignore */
  }
}

function notifyServiceWorkerScope(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const scope = contextScope(currentContext);
  const payload = { type: 'OFFLINE_SCOPE', scope };
  void navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage(payload);
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(payload);
      }
    })
    .catch(() => {});
}

loadContextFromStorage();

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('indexedDB indisponible'));
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onerror = () => reject(req.error ?? new Error('IDB open'));
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
    });
  }
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onerror = () => reject(r.error);
      r.onsuccess = () => resolve((r.result as T) ?? null);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

async function idbDeleteByPrefix(prefix: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const cursorReq = store.openCursor();
      cursorReq.onerror = () => reject(cursorReq.error);
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

export function setOfflineCacheContext(partial: Partial<OfflineCacheContext>): void {
  currentContext = normalizeContext(partial);
  saveContextToStorage();
  notifyServiceWorkerScope();
}

export async function saveUserSnapshot(user: unknown): Promise<void> {
  await idbSet(scopedKey(USER_KEY), user);
}

export async function loadUserSnapshot<T>(): Promise<T | null> {
  return idbGet<T>(scopedKey(USER_KEY));
}

export async function clearUserSnapshot(): Promise<void> {
  await idbDelete(scopedKey(USER_KEY));
}

/** Clé stable pour une requête GET (pathname + query). */
export function apiCacheKey(method: string, pathnameWithSearch: string): string {
  return scopedKey(`${method.toUpperCase()}|${pathnameWithSearch}`);
}

export async function saveApiCacheEntry(key: string, payload: unknown): Promise<void> {
  await idbSet(`api:${key}`, {
    savedAt: Date.now(),
    payload,
  });
}

export async function loadApiCacheEntry<T>(key: string): Promise<{ savedAt: number; payload: T } | null> {
  const raw = await idbGet<{ savedAt: number; payload: T }>(`api:${key}`);
  return raw ?? null;
}

export async function clearAllOfflineCaches(): Promise<void> {
  const prefix = `${contextScope(currentContext)}::`;
  await idbDeleteByPrefix(prefix);
}
