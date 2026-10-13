import { useCallback, useEffect, useRef, useState } from 'react';
import App from './App';
import { AccessScreen } from './components/Access/AccessScreen';
import { request, RequestError } from './utils/profileClient';
import { parseSnapshot, type Snapshot } from '../shared/finance.mjs';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { clearExpiredExports } from './utils/exportFile';

interface Session { profile: { id: string; username: string }; data: Snapshot; revision: number; csrf: string; }
export default function Workspace() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Saved to your profile');
  const channel = useRef<BroadcastChannel | null>(null);
  const generation = useRef(0);
  const leaving = useRef(false);
  const [notice, setNotice] = useState('');
  const auth = useRef<Session | null>(null);
  const pending = useRef<Snapshot | null>(null);
  const saving = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadSession = useCallback(async () => {
    const started = generation.current;
    try {
      const result = await request('session');
      if (started !== generation.current) return;
      const next: Session = { ...result, data: parseSnapshot(result.data) };
      auth.current = next; pending.current = null; setSession(next); setError(''); setStatus('Saved to your profile');
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) { auth.current = null; setSession(null); }
      else throw error;
    }
  }, []);
  useEffect(() => {
    const lock = () => { generation.current++; clearTimeout(timer.current); pending.current = null; auth.current = null; setSession(null); setError(''); setNotice('Your session changed. Sign in again to continue.'); };
    const broadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('paisapilot-session') : null;
    channel.current = broadcast;
    if (broadcast) broadcast.onmessage = lock;
    const check = async () => {
      if (!auth.current || document.visibilityState === 'hidden') return;
      const current = auth.current;
      try { const result = await request('session'); if (auth.current === current && result.profile.id !== current.profile.id) lock(); }
      catch (error) { if (auth.current === current && error instanceof RequestError && error.status === 401) lock(); }
    };
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check);
    return () => { broadcast?.close(); channel.current = null; window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, []);
  // eslint-disable-next-line react/set-state-in-effect -- Session initialization resolves asynchronously from the server.
  useEffect(() => { let active = true; loadSession().catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [loadSession]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (saving.current) return saving.current;
    const job = (async () => {
      while (pending.current && auth.current) {
        const owner = auth.current;
        const next = pending.current; pending.current = null;
        setStatus('Saving…');
        try {
          const result = await request('save', 'PUT', { revision: owner.revision, data: next }, owner.csrf);
          if (auth.current !== owner) return;
          owner.revision = result.revision;
          setError('');
        } catch (error) { if (auth.current !== owner) return; pending.current ||= next; setStatus('Not saved'); setError(error instanceof Error ? error.message : 'Could not save.'); throw error; }
      }
      setStatus('Saved to your profile');
    })();
    saving.current = job;
    try { await job; } finally { saving.current = null; }
  }, []);
  const onChange = useCallback((data: Snapshot) => {
    pending.current = data; setStatus('Unsaved changes'); clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush().catch(() => {}); }, 500);
  }, [flush]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void clearExpiredExports().catch(() => {});
    const listener = NativeApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) window.dispatchEvent(new Event('focus'));
      else void flush().catch(() => {});
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, [flush]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (pending.current || saving.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); clearTimeout(timer.current); };
  }, []);
  const logout = async () => {
    if (leaving.current) return;
    if (!window.confirm('Sign out on this device? Other open tabs will lock and discard unsaved changes. Export a backup there first.')) return;
    leaving.current = true;
    try { await flush(); await request('logout', 'POST', undefined, auth.current?.csrf); auth.current = null; setSession(null); setError(''); channel.current?.postMessage('changed'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Sign-out failed.'); }
    finally { leaving.current = false; }
  };
  const deleteProfile = async (password: string) => {
    clearTimeout(timer.current);
    if (saving.current) await saving.current.catch(() => {});
    await request('delete', 'POST', { password }, auth.current?.csrf);
    auth.current = null; pending.current = null; setSession(null); setError('');
    channel.current?.postMessage('changed');
  };
  if (loading) return <main className="access-loading" aria-busy="true"><h1>Opening your workspace…</h1></main>;
  if (!session && error) return <main className="access-loading"><h1>Workspace unavailable</h1><p role="alert">{error}</p><button className="primary-button" onClick={() => { setLoading(true); loadSession().catch(error => setError(error.message)).finally(() => setLoading(false)); }}>Try again</button></main>;
  if (!session) return <AccessScreen notice={notice} onAccess={async () => { await loadSession(); setNotice(''); channel.current?.postMessage('changed'); }}/>;
  return <App key={session.profile.id} initialData={session.data} onChange={onChange} saveStatus={status} saveError={error} onRetry={() => { void flush().catch(() => {}); }} onLogout={logout} onDeleteProfile={deleteProfile} username={session.profile.username}/>;
}
