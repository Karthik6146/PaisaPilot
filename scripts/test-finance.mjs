import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { test } from 'node:test';

// Use the project's installed TypeScript compiler; no test dependency is needed.
async function load(path, dependencies = {}) {
  let source = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  for (const [name, url] of Object.entries(dependencies)) source = source.replaceAll("'" + name + "'", "'" + url + "'");
  const url = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  return { module: await import(url), url };
}
const dates = await load('src/utils/dates.ts');
const { calculateStats } = (await load('src/utils/calculations.ts', { './dates': dates.url })).module;
const now = new Date(2026, 9, 9, 0, 15);
const tx = (amount, date = '2026-10-09', type = 'expense') => ({ id: 'tx-' + amount, type, amount, category: 'My category', note: 'A note', date, paymentMode: 'Cash', createdAt: 1 });
const budget = { monthlyTarget: 5000, categories: {} };

test('entered monthly pocket money funds the plan without an income record', () => {
  const stats = calculateStats([], [], budget, now);
  assert.equal(stats.currentBalance, 5000);
  assert.equal(stats.dailySafeLimit, 217.39);
  assert.equal(stats.daysRemainingInMonth, 23);
});
test('income does not double-count the monthly allowance and other months are isolated', () => {
  const stats = calculateStats([tx(5000, '2026-10-01', 'income'), tx(100), tx(1000, '2026-09-30')], [], budget, now);
  assert.equal(stats.totalIncome, 5000);
  assert.equal(stats.totalExpenses, 100);
  assert.equal(stats.currentBalance, 4900);
  assert.equal(stats.spentToday, 100);
  assert.equal(stats.todayStatus, 'under');
});
test('reserved priorities reduce daily available funds; paying them does not reduce free funds twice', () => {
  const before = calculateStats([], [], budget, now, 800);
  const after = calculateStats([tx(800)], [], budget, now, 0);
  assert.equal(before.availableToSpend, 4200);
  assert.equal(before.dailySafeLimit, after.dailySafeLimit);
});
test('zero, overspent, overreserved and final-day budgets stay finite', () => {
  for (const cap of [0, 100]) {
    const stats = calculateStats([tx(500)], [], { ...budget, monthlyTarget: cap }, now, 1000);
    assert.equal(stats.dailySafeLimit, 0);
    assert.ok(Number.isFinite(stats.projectedRunwayDays));
    assert.ok(stats.projectedRunwayDays >= 0);
    assert.equal(stats.currentBalance, cap - 500);
  }
  assert.equal(calculateStats([], [], budget, new Date(2026, 9, 31)).dailySafeLimit, 5000);
  assert.equal(calculateStats([], [], budget, new Date(2028, 1, 28)).daysRemainingInMonth, 2);
});
test('dates use the local calendar even just after midnight', () => {
  assert.equal(dates.module.localDate(now), '2026-10-09');
});
test('monthly budgets do not leak across months', () => {
  const plan = { ...budget, months: { '2026-10': { monthlyTarget: 4000, categories: { Health: 1000 } }, '2026-11': { monthlyTarget: 2000, categories: {} } } };
  assert.equal(dates.module.monthBudget(plan, '2026-10').monthlyTarget, 4000);
  assert.equal(dates.module.monthBudget(plan, '2026-11').monthlyTarget, 2000);
  assert.equal(dates.module.monthBudget({ ...plan, monthlyTarget: 0 }, '2026-12').monthlyTarget, 0);
});


const sharedUrl = new URL('../shared/finance.mjs', import.meta.url).href;
const { emptySnapshot, parseSnapshot, parseBackup, exportBackup, csvCell } = await import(sharedUrl);
const { arithmetic } = (await load('src/utils/arithmetic.ts')).module;
const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
const legacy = (await load('src/utils/storage.ts', { '../../shared/finance.mjs': sharedUrl })).module;
const loan = () => ({ id: 'l1', type: 'lent', personName: 'Friend', personContact: '1234567890', originalAmount: 100, dateTaken: '2026-10-09', dueDate: '2026-10-12', note: '', isSettled: false, payments: [], createdAt: 1 });

test('new profiles have no personal defaults or seeded finance records', () => {
  assert.equal(emptySnapshot().settings.userName, '');
  const profile = emptySnapshot('A private profile');
  assert.equal(profile.settings.userName, 'A private profile');
  assert.deepEqual(profile.transactions, []);
  assert.deepEqual(profile.budget.categories, {});
});
test('backup validation strips legacy secrets and unknown fields', () => {
  const profile = emptySnapshot('Example');
  profile.transactions = [tx(100)];
  profile.settings.geminiApiKey = 'dummy-private-key';
  profile.settings.unknown = 'unexpected';
  profile.loans = [{ ...loan(), unknown: 'extra' }];
  const exported = exportBackup(profile);
  assert.ok(!exported.includes('dummy-private-key'));
  assert.ok(!exported.includes('unexpected'));
  assert.ok(!exported.includes('unknown'));
  assert.equal(parseBackup(exported).transactions[0].amount, 100);
});
test('malformed optional fields, duplicate IDs, invalid dates and prototype categories are rejected', () => {
  for (const invalid of [
    { ...loan(), personContact: {} },
    { ...loan(), payments: [{ id: 'p', amount: 1, date: '2026-10-09', note: {} }] },
    { ...loan(), originalAmount: Infinity },
    { ...loan(), payments: [{ id: 'p', amount: 101, date: '2026-10-09' }] },
  ]) { const data = emptySnapshot('Example'); data.loans = [invalid]; assert.throws(() => parseSnapshot(data)); }
  for (const transaction of [tx(-1), tx(Infinity), tx(1, '2026-02-31'), { ...tx(1), category: '__proto__' }, { ...tx(1), note: 'x'.repeat(501) }]) { const data = emptySnapshot('Example'); data.transactions = [transaction]; assert.throws(() => parseSnapshot(data)); }
  const data = emptySnapshot(); data.transactions = [tx(100), tx(100)]; assert.throws(() => parseSnapshot(data));
  assert.throws(() => parseBackup(' '.repeat(1000001)));
});
test('monthly notes and priorities remain isolated and round-trip', () => {
  const data = emptySnapshot('Example');
  data.budget.months['2026-10'] = { monthlyTarget: 5000, categories: { Food: 1000 } };
  data.budget.priorities = [{ id: 'p1', month: '2026-10', title: 'Checkup', amount: 500, category: 'Health', priority: 'Must have' }];
  data.budget.notes = [{ id: 'n1', month: '2026-10', text: 'Remember appointment', pinned: true }];
  assert.deepEqual(parseBackup(exportBackup(data)), data);
});
test('old browser deletion removes every live and recovery copy and reports failures', () => {
  const keys = ['transactions', 'loans', 'budget', 'settings'].flatMap(type => ['pocketguard_' + type + '_v1', 'pocketguard_' + type + '_v1_recovery']);
  for (const key of keys) memory.set(key, 'dummy');
  assert.equal(legacy.clearLegacyData(), true);
  assert.ok(keys.every(key => !memory.has(key)));
  const original = localStorage.removeItem; const attempts = [];
  localStorage.removeItem = key => { attempts.push(key); if (key.includes('transactions')) throw new Error('blocked'); memory.delete(key); };
  assert.equal(legacy.clearLegacyData(), false);
  assert.equal(attempts.length, 8);
  localStorage.removeItem = original;
});
test('CSV treats formulas and leading whitespace/control variants as text', () => {
  for (const value of ['=1+1', '+1+1', '-1+1', '@SUM(1)', '\t=1+1', '\r=1+1', '\n=1+1', '   =1+1', '\u0000=1+1']) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell(123.45), '"123.45"');
});
test('arithmetic parser preserves precedence and rejects script, overflow and malformed inputs', () => {
  for (const [input, expected] of [['2+3*4', 14], ['(2+3)*4', 20], ['-2 + +3', 1], ['10/4', 2.5], ['.1+.2', .3], ['8/(-2)', -4]]) assert.equal(arithmetic(input), expected);
  for (const input of ['alert(1)', '1/0', '1**2', '2(3)', '.', '1 2', '1e3', '1+','('.repeat(40)+'1'+')'.repeat(40), '999999999*999999999']) assert.throws(() => arithmetic(input));
});
test('backup exports pending in-memory changes independently of old browser storage', () => {
  memory.set('pocketguard_transactions_v1', '[]');
  const pending = emptySnapshot('Example'); pending.transactions = [tx(777)];
  assert.equal(JSON.parse(exportBackup(pending)).transactions[0].amount, 777);
  assert.equal(memory.get('pocketguard_transactions_v1'), '[]');
});
test('decimal calculations do not invent overspending', () => {
  const stats = calculateStats([tx(0.1), tx(0.2)], [], { monthlyTarget: 0.3, categories: {} }, now);
  assert.equal(stats.currentBalance, 0);
});