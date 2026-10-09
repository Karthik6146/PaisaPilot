import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../server/handler.mjs';
import { readConfig, equal } from '../server/auth.mjs';
import { emptySnapshot } from '../shared/finance.mjs';
import { memoryStore } from './fixtures/profile-store.mjs';
import { databaseClient } from '../server/store.mjs';
import { X509Certificate } from 'node:crypto';
const password = 'a-dummy-password-2026';
test('Supabase pooler settings prevent TLS downgrade, named statements and query pipelining', async () => {
  const client = databaseClient('postgresql://dummy:dummy@localhost:6543/postgres?sslmode=disable&prepare=true&max_pipeline=100');
  try {
    assert.equal(client.options.ssl.rejectUnauthorized, true);
    const ca = new X509Certificate(client.options.ssl.ca);
    assert.equal(ca.ca, true);
    assert.ok(Date.parse(ca.validTo) > Date.now(), 'Supabase root certificate must not be expired.');
    assert.equal(client.options.prepare, false);
    assert.equal(client.options.max, 1);
    assert.equal(client.options.max_pipeline, 1);
  } finally { await client.end(); }
});
async function fixture(t) {
  const store = memoryStore();
  const cfg = { origin: '', production: false, invite: '102030', secret: 'test-only-secret-'.repeat(3), database: 'not-used' };
  const server = createServer(createHandler({ store, config: () => cfg }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  cfg.origin = 'http://127.0.0.1:' + server.address().port;
  t.after(() => new Promise(resolve => server.close(resolve)));
  const call = async (action, { method = 'GET', data, cookie, csrf, origin = cfg.origin } = {}) => {
    const response = await fetch(cfg.origin + '/api/index?action=' + action, { method, headers: { Origin: origin, ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  };
  const register = async (username, name = username) => call('register', { method: 'POST', data: { username, name, password, code: cfg.invite } });
  return { store, cfg, call, register };
}
test('server configuration fails closed, origin and unicode comparison are safe', () => {
  assert.throws(() => readConfig({}));
  assert.throws(() => readConfig({ APP_ORIGIN: 'http://example.com', INVITE_CODE: '102030', SESSION_SECRET: 'x'.repeat(32), DATABASE_URL: 'dummy', NODE_ENV: 'production' }));
  assert.equal(equal('é'.repeat(64), 'a'.repeat(64)), false);
});

test('application origin accepts a pasted root URL while rejecting unsafe origins', () => {
  const env = { APP_ORIGIN: ' https://paisa-pilot-umber.vercel.app/\n', INVITE_CODE: '102030', SESSION_SECRET: 'x'.repeat(32), DATABASE_URL: 'dummy', VERCEL: '1' };
  assert.equal(readConfig(env).origin, 'https://paisa-pilot-umber.vercel.app');
  for (const origin of ['https://example.com/path', 'https://example.com/?query=1', 'https://example.com/#fragment', 'https://user:password@example.com/', 'http://localhost:5173/', 'ftp://localhost/']) {
    assert.throws(() => readConfig({ ...env, APP_ORIGIN: origin }));
  }
  assert.equal(readConfig({ ...env, VERCEL: '0', APP_ORIGIN: 'http://localhost:5173/' }).origin, 'http://localhost:5173');
  assert.throws(() => readConfig({ ...env, VERCEL: '0', APP_ORIGIN: 'ftp://localhost/' }));
});
test('invite, password, session, method and origin gates protect the API', async t => {
  const { call, register, store } = await fixture(t);
  assert.equal((await call('session')).status, 401);
  for (const action of ['constructor', '__proto__', 'toString']) assert.equal((await call(action)).status, 404);
  assert.equal((await call('register', { method: 'POST', data: { username: 'alice', name: 'Alice', password, code: '999999' } })).status, 401);
  assert.equal(store.profiles.size, 0);
  const a = await register('alice'); assert.equal(a.status, 200);
  assert.match(a.headers.get('set-cookie'), /HttpOnly/); assert.match(a.headers.get('set-cookie'), /SameSite=Strict/);
  const session = await call('session', { cookie: a.cookie }); assert.equal(session.status, 200);
  assert.equal(session.headers.get('cache-control'), 'no-store'); assert.ok(!JSON.stringify(session.body).includes('password_hash'));
  assert.equal((await call('save', { method: 'PUT', cookie: a.cookie, data: { revision: 0, data: emptySnapshot('Alice') } })).status, 403);
  assert.equal((await call('logout', { method: 'POST', cookie: a.cookie, csrf: session.body.csrf, origin: 'https://attacker.invalid' })).status, 403);
  assert.equal((await call('save', { method: 'POST', cookie: a.cookie })).status, 405);
  assert.equal((await call('login', { method: 'POST', data: { username: 'alice', password: 'wrong-dummy-password', code: '102030' } })).status, 401);
  const hash = [...store.profiles.values()][0].password_hash; assert.ok(!hash.includes(password)); assert.match(hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
  const cfg = { production: true, origin: 'https://example.test', invite: '102030', secret: 'x'.repeat(32), database: 'unused' };
  const prod = createHandler({ store: memoryStore(), config: () => cfg }); const headers = {}; let result;
  await prod({ url: '/api/index?action=register', method: 'POST', headers: { origin: cfg.origin, 'content-type': 'application/json' }, body: { username: 'bob', name: 'Bob', password, code: cfg.invite } }, { setHeader: (k, v) => headers[k] = v, end: value => result = value });
  assert.match(headers['Set-Cookie'], /; Secure/); assert.equal(JSON.parse(result).ok, true);
});
test('two profiles stay isolated; revision conflicts cannot overwrite newer data', async t => {
  const { call, register } = await fixture(t); const a = await register('alice'), b = await register('bob');
  const sa = (await call('session', { cookie: a.cookie })).body, sb = (await call('session', { cookie: b.cookie })).body;
  const next = emptySnapshot('Alice'); next.budget.months['2026-10'] = { monthlyTarget: 5000, categories: {} };
  const saved = await call('save', { method: 'PUT', cookie: a.cookie, csrf: sa.csrf, data: { revision: 0, profileId: sb.profile.id, data: next } }); assert.equal(saved.status, 200);
  assert.equal((await call('session', { cookie: b.cookie })).body.data.budget.months['2026-10'], undefined);
  assert.equal((await call('session', { cookie: a.cookie })).body.data.budget.months['2026-10'].monthlyTarget, 5000);
  assert.equal((await call('save', { method: 'PUT', cookie: a.cookie, csrf: sa.csrf, data: { revision: 0, data: emptySnapshot('Old') } })).status, 409);
  next.loans = [{ personContact: {} }]; assert.equal((await call('save', { method: 'PUT', cookie: a.cookie, csrf: sa.csrf, data: { revision: 1, data: next } })).status, 422);
});
test('logout, invite rotation, expiry and profile deletion revoke access', async t => {
  const { call, register, cfg, store } = await fixture(t); const a = await register('alice'); const session = (await call('session', { cookie: a.cookie })).body;
  cfg.invite = '654321'; assert.equal((await call('session', { cookie: a.cookie })).status, 401); cfg.invite = '102030';
  assert.equal((await call('delete', { method: 'POST', cookie: a.cookie, csrf: session.csrf, data: { password: 'wrong' } })).status, 401);
  assert.equal((await call('delete', { method: 'POST', cookie: a.cookie, csrf: session.csrf, data: { password } })).status, 200);
  assert.equal(store.profiles.size, 0); assert.equal(store.sessions.size, 0);
  const b = await register('bob'); const sb = (await call('session', { cookie: b.cookie })).body;
  assert.equal((await call('logout', { method: 'POST', cookie: b.cookie, csrf: sb.csrf })).status, 200);
  assert.equal((await call('session', { cookie: b.cookie })).status, 401);
  const c = await register('charlie'); for (const s of store.sessions.values()) s.expires_at = '2000-01-01'; assert.equal((await call('session', { cookie: c.cookie })).status, 401);
});
test('shared throttling and request-size limits cannot be skipped', async t => {
  const { call, store } = await fixture(t); let blocked;
  for (let i = 0; i < 21; i++) blocked = await call('login', { method: 'POST', data: { username: 'user_' + i, password, code: '999999' } });
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '900'); store.limits.clear();
  assert.equal((await call('register', { method: 'POST', data: { large: 'x'.repeat(1000001) } })).status, 413);
});
