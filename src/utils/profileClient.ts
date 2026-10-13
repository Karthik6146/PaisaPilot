import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Public deployment address only. Secrets stay on the server.
const APP_ORIGIN = 'https://paisa-pilot-umber.vercel.app';
export class RequestError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function request(action: string, method = 'GET', body?: unknown, csrf?: string) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const path = '/api/index?action=' + encodeURIComponent(action);
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) };
    if (Capacitor.isNativePlatform()) {
      // Android's private cookie jar retains the HttpOnly session; browser origin checks stay intact.
      const response = await CapacitorHttp.request({ url: APP_ORIGIN + path, method, headers: { ...headers, Origin: APP_ORIGIN }, data: body, responseType: 'json', connectTimeout: 15000, readTimeout: 15000, disableRedirects: true });
      if (response.status < 200 || response.status >= 300) throw new RequestError(response.data?.error || 'Workspace unavailable. Try again.', response.status);
      return response.data;
    }
    const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', signal: abort.signal, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new RequestError(result.error || 'Request failed.', response.status);
    return result;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('Connection interrupted. Your changes remain on screen.', 0);
  } finally { clearTimeout(timeout); }
}
