import { randomUUID } from 'node:crypto';
import { emptySnapshot, parseSnapshot, MAX_BACKUP_BYTES } from '../shared/finance.mjs';
import { postgresStore } from './store.mjs';
import { readConfig, token, hashToken, privateHash, equal, hashPassword, checkPassword } from './auth.mjs';

const cookieName = config => config.production ? '__Host-paisapilot_session' : 'paisapilot_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const methods = { session: 'GET', login: 'POST', register: 'POST', save: 'PUT', logout: 'POST', delete: 'POST' };
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
async function body(req) {
  const declared = Number(req.headers['content-length']);
  if (declared > MAX_BACKUP_BYTES) throw new HttpError(413, 'Request must be under 1 MB.');
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'JSON required.');
  let value = req.body;
  if (value === undefined) { const chunks = []; let size = 0; for await (const chunk of req) { size += Buffer.byteLength(chunk); if (size > MAX_BACKUP_BYTES) throw new HttpError(413, 'Request must be under 1 MB.'); chunks.push(Buffer.from(chunk)); } value = Buffer.concat(chunks).toString('utf8'); }
  if (typeof value === 'string' && Buffer.byteLength(value) > MAX_BACKUP_BYTES) throw new HttpError(413, 'Request must be under 1 MB.');
  try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Buffer.byteLength(JSON.stringify(parsed)) > MAX_BACKUP_BYTES) throw new Error(); return parsed; } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
const cookieToken = (req, config) => { const name = cookieName(config) + '='; const cookie = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith(name)); const value = cookie?.slice(name.length) || ''; return /^[a-f0-9]{64}$/.test(value) ? value : ''; };
function setCookie(res, value, config, age = SESSION_SECONDS) { res.setHeader('Set-Cookie', `${cookieName(config)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${config.production ? '; Secure' : ''}`); }
const credentials = b => typeof b.username === 'string' && /^[a-zA-Z0-9_]{3,32}$/.test(b.username) && typeof b.password === 'string' && b.password.length >= 12 && b.password.length <= 128;

export function createHandler({ store: suppliedStore, config: getConfig = readConfig } = {}) {
  let cachedStore;
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    try {
      let cfg;
      try { cfg = getConfig(); } catch { throw new HttpError(503, 'This workspace is not configured yet. Contact the site owner.'); }
      const action = new URL(req.url, cfg.origin).searchParams.get('action');
      if (!Object.hasOwn(methods, action)) throw new HttpError(404, 'Not found.');
      if (req.method !== methods[action]) { res.setHeader('Allow', methods[action]); throw new HttpError(405, 'Method not allowed.'); }
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== cfg.origin) || (req.method !== 'GET' && req.headers.origin !== cfg.origin)) throw new HttpError(403, 'Request origin not allowed.');
      const store = suppliedStore || (cachedStore ??= postgresStore(cfg.database));
      const inviteHash = privateHash(cfg.invite, cfg.secret);
      if (action === 'login' || action === 'register') {
        // Vercel replaces this header. Local development uses the socket, never a forwarded client header.
        const ip = cfg.production ? (req.headers['x-vercel-forwarded-for'] || 'unknown').split(',')[0].trim() : (req.socket?.remoteAddress || 'local');
        if (!await store.throttle(privateHash('ip:' + ip, cfg.secret), 20) || !await store.throttle(privateHash('global-auth', cfg.secret), 1000)) { res.setHeader('Retry-After', '900'); throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.'); }
        const b = await body(req);
        if (!credentials(b)) throw new HttpError(400, 'Use a 3–32 character username and a 12–128 character password.');
        const username = b.username.toLowerCase();
        if (!await store.throttle(privateHash('username:' + username, cfg.secret), 10)) { res.setHeader('Retry-After', '900'); throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.'); }
        if (typeof b.code !== 'string' || !/^\d{6}$/.test(b.code) || !equal(privateHash(b.code, cfg.secret), inviteHash)) throw new HttpError(401, 'Check your invite code and profile credentials.');
        let profile;
        if (action === 'register') {
          if (typeof b.name !== 'string' || !b.name.trim() || b.name.trim().length > 50) throw new HttpError(400, 'Enter a profile name under 50 characters.');
          profile = await store.register({ id: randomUUID(), username, password_hash: await hashPassword(b.password), data: emptySnapshot(b.name.trim()) });
          if (!profile) throw new HttpError(409, 'Choose another username or sign in.');
        } else {
          profile = await store.findProfile(username);
          if (!await checkPassword(b.password, profile?.password_hash)) throw new HttpError(401, 'Check your invite code and profile credentials.');
        }
        const sessionToken = token();
        await store.cleanup();
        await store.addSession({ token_hash: hashToken(sessionToken), profile_id: profile.id, invite_hash: inviteHash, csrf: token(), expires_at: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() });
        // Replace the browser's previous session instead of leaving it valid after a profile switch.
        if (cookieToken(req, cfg)) await store.removeSession(hashToken(cookieToken(req, cfg)));
        setCookie(res, sessionToken, cfg);
        return send(200, { ok: true });
      }
      const rawToken = cookieToken(req, cfg);
      const session = rawToken && await store.session(hashToken(rawToken), inviteHash);
      if (!session) { setCookie(res, '', cfg, 0); throw new HttpError(401, 'Sign in with your invite code to continue.'); }
      if (action === 'session') return send(200, { profile: { id: session.profile_id, username: session.username }, data: session.data, revision: session.revision, csrf: session.csrf });
      if (!equal(req.headers['x-csrf-token'], session.csrf)) throw new HttpError(403, 'Request verification failed. Refresh and try again.');
      if (action === 'logout') { await store.removeSession(hashToken(rawToken)); setCookie(res, '', cfg, 0); return send(200, { ok: true }); }
      const b = await body(req);
      if (action === 'delete') {
        if (!await store.throttle(privateHash('delete:' + session.profile_id, cfg.secret), 5)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
        if (typeof b.password !== 'string' || b.password.length > 128 || !await checkPassword(b.password, await store.password(session.profile_id))) throw new HttpError(401, 'Password incorrect.');
        await store.deleteProfile(session.profile_id);
        setCookie(res, '', cfg, 0);
        return send(200, { ok: true });
      }
      if (!Number.isSafeInteger(b.revision) || b.revision < 0 || b.revision > 2_000_000_000) throw new HttpError(400, 'Invalid revision.');
      let data;
      try { data = parseSnapshot(b.data); if (!data.settings.userName.trim()) throw new Error(); } catch { throw new HttpError(422, 'Invalid financial data. Check field lengths, amounts and dates.'); }
      // Profile identity comes exclusively from the authenticated session, never a client ID.
      const saved = await store.save(session.profile_id, b.revision, data);
      if (!saved) throw new HttpError(409, 'This profile changed in another tab. Export pending changes, then reload before editing.');
      return send(200, { revision: saved.revision });
    } catch (error) {
      if (!(error instanceof HttpError)) console.error('Workspace request failed:', error.code || 'internal_error');
      return send(error.status || 503, { error: error instanceof HttpError ? error.message : 'Workspace unavailable. Your changes remain on screen; export a backup and try again.' });
    }
  };
}
