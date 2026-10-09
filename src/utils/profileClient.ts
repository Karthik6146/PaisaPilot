export class RequestError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function request(action: string, method = 'GET', body?: unknown, csrf?: string) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch('/api/index?action=' + action, { method, credentials: 'same-origin', cache: 'no-store', signal: abort.signal, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new RequestError(result.error || 'Request failed.', response.status);
    return result;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('Connection interrupted. Your changes remain on screen.', 0);
  } finally { clearTimeout(timeout); }
}
