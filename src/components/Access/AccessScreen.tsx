import { useState } from 'react';
import { Wallet, LockKeyhole, ArrowRight, Moon, Sun } from 'lucide-react';
import { request } from '../../utils/profileClient';

export function AccessScreen({ onAccess, notice }: { onAccess: () => Promise<void>; notice?: string }) {
  const [create, setCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  return <main className="access-page"><section className="access-story" aria-label="About PaisaPilot"><a className="brand" href="#access"><span className="brand-icon"><Wallet size={25}/></span><span>PaisaPilot<small>Your money, your pace.</small></span></a><div><span className="eyebrow">A SMALL SPACE FOR YOUR BIG PLANS</span><h1>Make room for<br/>what matters.</h1><p>A monthly budget. A little daily awareness. A clearer picture of where your money goes.</p><div className="access-example"><span>YOUR OWN WORKSPACE</span><strong>One profile.<br/>Your entire money story.</strong><p>Plan your month, track your spending, and keep your notes together.</p></div></div><p className="access-footer"><LockKeyhole size={16}/> Invite only. Private profiles.</p></section>
    <section className="access-form-area" id="access"><button className="secondary-button access-theme" onClick={() => { setDark(!dark); document.documentElement.dataset.theme = dark ? 'light' : 'dark'; }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="access-card"><span className="eyebrow">WELCOME TO PAISAPILOT</span><h2>{create ? 'Your space starts here.' : 'Welcome back.'}</h2><p>{create ? 'Use your invite to create a private profile.' : 'Enter your invite code and sign in to your profile.'}</p>
      {notice && <p role="status" className="form-hint">{notice}</p>}
      <form className="widget-form" onSubmit={async e => { e.preventDefault(); if (busy) return; const data = Object.fromEntries(new FormData(e.currentTarget)); setBusy(true); setError(''); try { await request(create ? 'register' : 'login', 'POST', data); await onAccess(); } catch (error) { setError(error instanceof Error ? error.message : 'Could not sign in.'); } finally { setBusy(false); } }}>
        <fieldset disabled={busy} className="access-fields"><label className="field">Invite code<input name="code" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="off" placeholder="Six digits from the site owner"/></label>
          {create && <label className="field">Profile name<input name="name" autoComplete="name" maxLength={50} required placeholder="Your full name"/></label>}
          <label className="field">Username<input name="username" autoComplete="username" pattern="[A-Za-z0-9_]{3,32}" minLength={3} maxLength={32} required placeholder="Choose letters, numbers or underscores" autoCapitalize="none" spellCheck={false}/></label>
          <label className="field">Password<input name="password" type="password" autoComplete={create ? 'new-password' : 'current-password'} minLength={12} maxLength={128} required placeholder={create ? 'At least 12 characters' : 'Your profile password'}/></label>
          {create && <p className="form-hint">Save your password somewhere safe. Password recovery is not available yet.</p>}
          {error && <p className="inline-warning" role="alert">{error}</p>}
          <button type="submit" className="primary-button full-width">{busy ? 'Please wait…' : create ? 'Create my profile' : 'Open my workspace'}<ArrowRight size={17}/></button>
        </fieldset>
      </form><p className="access-switch">{create ? 'Already have a profile?' : 'First time here?'} <button disabled={busy} onClick={() => { setCreate(!create); setError(''); }}>{create ? 'Sign in' : 'Create a profile'}</button></p><p className="form-hint">The invite gets you in. Your password keeps your profile private.</p>
    </div></section></main>;
}
