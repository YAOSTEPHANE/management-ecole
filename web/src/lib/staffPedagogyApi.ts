import type { AxiosInstance } from 'axios';
import legacyApi from '@/services/api';
import api from '@/services/api/client';

const attached = new WeakSet<AxiosInstance>();

function isStaffPedagogyContext(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/staff');
}

/** Réécrit /admin/… → /staff/pedagogy/… (chemins relatifs ou URL absolues). */
export function rewriteAdminGetUrl(url: string): string {
  if (!url || !url.includes('/admin/')) return url;
  return url.replace('/admin/', '/staff/pedagogy/');
}

function attachStaffPedagogyInterceptor(instance: AxiosInstance, instanceLabel: string): void {
  if (attached.has(instance)) return;
  attached.add(instance);
  instance.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();
    const url = config.url ?? '';
    const inStaff = isStaffPedagogyContext();
    // #region agent log
    if (url.includes('/admin/')) {
      fetch('http://127.0.0.1:27772/ingest/8fcbe373-cd61-4167-a91a-7ca0597a67fb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9b55cf' },
        body: JSON.stringify({
          sessionId: '9b55cf',
          hypothesisId: 'H3',
          location: 'staffPedagogyApi.ts:interceptor',
          message: 'admin GET intercepted',
          data: { instanceLabel, method, urlBefore: url, inStaff, pathname: typeof window !== 'undefined' ? window.location.pathname : null },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    if (!inStaff) return config;
    if (method !== 'get' && method !== 'head') return config;
    const rewritten = rewriteAdminGetUrl(url);
    if (rewritten !== url) {
      config.url = rewritten;
      // #region agent log
      fetch('http://127.0.0.1:27772/ingest/8fcbe373-cd61-4167-a91a-7ca0597a67fb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9b55cf' },
        body: JSON.stringify({
          sessionId: '9b55cf',
          hypothesisId: 'H4',
          location: 'staffPedagogyApi.ts:rewrite',
          message: 'URL rewritten',
          data: { instanceLabel, urlAfter: rewritten },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
    return config;
  });
}

/**
 * Installe l’intercepteur GET sur les deux instances axios du projet
 * (client.ts ET services/api.ts legacy utilisé par adminApi).
 */
export function ensureStaffPedagogyApiInterceptor(): void {
  attachStaffPedagogyInterceptor(api, 'client.ts');
  attachStaffPedagogyInterceptor(legacyApi, 'api.ts-legacy');
  // #region agent log
  fetch('http://127.0.0.1:27772/ingest/8fcbe373-cd61-4167-a91a-7ca0597a67fb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9b55cf' },
    body: JSON.stringify({
      sessionId: '9b55cf',
      hypothesisId: 'H1',
      location: 'staffPedagogyApi.ts:ensure',
      message: 'interceptors attached',
      data: { clientAttached: attached.has(api), legacyAttached: attached.has(legacyApi) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/** @deprecated */
export function registerStaffPedagogyApiInterceptor(): void {
  ensureStaffPedagogyApiInterceptor();
}

/** @deprecated */
export function unregisterStaffPedagogyApiInterceptor(): void {
  /* no-op */
}
