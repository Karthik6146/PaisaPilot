import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { databaseClient } from '../server/store.mjs';

process.loadEnvFile('.env.local');
const origin = 'http://localhost:5173';
assert.equal(process.env.APP_ORIGIN, origin, 'Run this check only against the configured local development server.');
const sql = databaseClient(process.env.DATABASE_URL);
const suffix = randomBytes(5).toString('hex');
const password = randomBytes(24).toString('hex');
const created = [];
async function call(action, method = 'GET', data, cookie, csrf) {
  const response = await fetch(origin + '/api/index?action=' + action, { method, headers: { Origin: origin, ...(data ? {'Content-Type': 'application/json'} : {}), ...(cookie ? {Cookie: cookie} : {}), ...(csrf ? {'X-CSRF-Token': csrf} : {}) }, body: data ? JSON.stringify(data) : undefined });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
try {
  const sessions = [];
  for (const label of ['alpha', 'beta']) {
    const username = 'verify_' + label + '_' + suffix;
    const result = await call('register', 'POST', {username, name: 'Temporary database check', password, code: process.env.INVITE_CODE});
    assert.equal(result.status, 200, 'Real database signup must succeed.');
    created.push(username);
    const current = await call('session', 'GET', undefined, result.cookie);
    assert.equal(current.status, 200);
    assert.equal(current.body.data.transactions.length, 0);
    sessions.push({cookie: result.cookie, ...current.body});
  }
  const [alpha, beta] = sessions;
  alpha.data.budget.months['2026-10'] = {monthlyTarget: 5000, categories: {Food: 1000}};
  alpha.data.transactions.push({id: randomBytes(8).toString('hex'), type: 'expense', amount: 100, category: 'Food', note: 'Temporary connection check', date: '2026-10-09', paymentMode: 'Cash', createdAt: Date.now()});
  const saved = await call('save', 'PUT', {revision: alpha.revision, profileId: beta.profile.id, data: alpha.data}, alpha.cookie, alpha.csrf);
  assert.equal(saved.status, 200, 'Real database save must succeed.');
  const reloaded = await call('session', 'GET', undefined, alpha.cookie);
  assert.equal(reloaded.body.data.budget.months['2026-10'].monthlyTarget, 5000);
  assert.equal(reloaded.body.data.transactions[0].amount, 100);
  const isolated = await call('session', 'GET', undefined, beta.cookie);
  assert.equal(isolated.body.data.transactions.length, 0);
  assert.equal(isolated.body.data.budget.months['2026-10'], undefined);
  assert.equal((await call('save', 'PUT', {revision: alpha.revision, data: alpha.data}, alpha.cookie, alpha.csrf)).status, 409);
  for (const session of sessions) assert.equal((await call('delete', 'POST', {password}, session.cookie, session.csrf)).status, 200);
  assert.equal((await call('session', 'GET', undefined, alpha.cookie)).status, 401);
  console.log('Live Supabase checks passed: signup, budget/expense persistence, profile isolation, conflict protection and deletion.');
} finally {
  for (const username of created) await sql`DELETE FROM paisapilot.profiles WHERE username = ${username}`;
  await sql.end();
  console.log('Temporary verification profiles removed.');
}
