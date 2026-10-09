export const DEFAULT_SETTINGS = Object.freeze({ theme: 'light', currency: 'INR', currencySymbol: '₹', userName: '', monthlyAllowance: 0, soundEnabled: false });
export const emptySnapshot = (name = '') => ({ transactions: [], loans: [], budget: { monthlyTarget: 0, categories: {}, months: {}, priorities: [], notes: [] }, settings: { ...DEFAULT_SETTINGS, userName: name } });
export const MAX_BACKUP_BYTES = 1_000_000;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
export const validMoney = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e9;
export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const category = value => text(value, 60, true) && !['__proto__', 'constructor', 'prototype'].includes(value.trim());
const month = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const id = value => text(value, 100, true);
const timestamp = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e15;
const list = (value, max, check) => Array.isArray(value) && value.length <= max && value.every(check) && new Set(value.map(item => item.id)).size === value.length;
const allocations = value => object(value) && Object.keys(value).length <= 100 && Object.entries(value).every(([key, amount]) => category(key) && validMoney(amount));
const transaction = t => object(t) && id(t.id) && ['expense', 'income'].includes(t.type) && validMoney(t.amount) && t.amount > 0 && category(t.category) && text(t.note, 500) && validDate(t.date) && text(t.paymentMode, 60, true) && timestamp(t.createdAt) && (t.time === undefined || text(t.time, 20)) && (t.tags === undefined || (Array.isArray(t.tags) && t.tags.length <= 20 && t.tags.every(tag => text(tag, 60))));
const payment = p => object(p) && id(p.id) && validMoney(p.amount) && p.amount > 0 && validDate(p.date) && (p.note === undefined || text(p.note, 500));
const loan = l => object(l) && id(l.id) && ['lent', 'borrowed'].includes(l.type) && text(l.personName, 100, true) && (l.personContact === undefined || text(l.personContact, 40)) && validMoney(l.originalAmount) && l.originalAmount > 0 && validDate(l.dateTaken) && validDate(l.dueDate) && text(l.note, 500) && typeof l.isSettled === 'boolean' && (l.createdAt === undefined || timestamp(l.createdAt)) && (l.settledAt === undefined || validDate(l.settledAt)) && list(l.payments, 500, payment) && l.payments.reduce((sum, p) => sum + p.amount, 0) <= l.originalAmount + 0.01;
const priority = p => object(p) && id(p.id) && month(p.month) && text(p.title, 100, true) && validMoney(p.amount) && p.amount > 0 && category(p.category) && ['Must have', 'Important', 'Can wait'].includes(p.priority) && (p.paidTransactionId === undefined || id(p.paidTransactionId));
const note = n => object(n) && id(n.id) && month(n.month) && text(n.text, 1000, true) && typeof n.pinned === 'boolean';
const plan = b => object(b) && validMoney(b.monthlyTarget) && allocations(b.categories);
const settings = s => object(s) && text(s.userName, 50) && text(s.currencySymbol, 5, true) && (s.currency === undefined || text(s.currency, 10, true)) && validMoney(s.monthlyAllowance) && typeof s.soundEnabled === 'boolean' && (s.theme === undefined || ['light', 'dark'].includes(s.theme));
const pick = (value, keys) => Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));

// Allowlisted copies keep legacy secrets and arbitrary imported fields out of storage and exports.
export function parseSnapshot(value) {
  if (!object(value) || !list(value.transactions, 5000, transaction) || !list(value.loans, 500, loan) || !plan(value.budget) || !settings(value.settings)) throw new Error('Invalid backup. Check amounts, dates, categories and field lengths.');
  const b = value.budget;
  if ((b.months !== undefined && (!object(b.months) || Object.keys(b.months).length > 1200 || !Object.entries(b.months).every(([key, p]) => month(key) && plan(p)))) || (b.priorities !== undefined && !list(b.priorities, 500, priority)) || (b.notes !== undefined && !list(b.notes, 2000, note))) throw new Error('Invalid monthly plan.');
  const budget = { monthlyTarget: b.monthlyTarget, categories: { ...b.categories }, months: Object.fromEntries(Object.entries(b.months || {}).map(([key, p]) => [key, { monthlyTarget: p.monthlyTarget, categories: { ...p.categories } }])), priorities: (b.priorities || []).map(p => pick(p, ['id', 'month', 'title', 'amount', 'category', 'priority', 'paidTransactionId'])), notes: (b.notes || []).map(n => pick(n, ['id', 'month', 'text', 'pinned'])) };
  // Assign old single-month backups once; never assign old personal data to new profiles automatically.
  if (!b.months) { const d = new Date(); budget.months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = { monthlyTarget: b.monthlyTarget, categories: { ...b.categories } }; budget.monthlyTarget = 0; budget.categories = {}; }
  return {
    transactions: value.transactions.map(t => pick(t, ['id', 'type', 'amount', 'category', 'note', 'date', 'time', 'paymentMode', 'tags', 'createdAt'])),
    loans: value.loans.map(l => ({ ...pick(l, ['id', 'type', 'personName', 'personContact', 'originalAmount', 'dateTaken', 'dueDate', 'note', 'isSettled', 'settledAt']), createdAt: l.createdAt ?? 0, payments: l.payments.map(p => pick(p, ['id', 'amount', 'date', 'note'])) })),
    budget, settings: { ...DEFAULT_SETTINGS, ...pick(value.settings, ['currency', 'currencySymbol', 'userName', 'monthlyAllowance', 'soundEnabled', 'theme']) },
  };
}
export function parseBackup(json) {
  if (typeof json !== 'string' || new TextEncoder().encode(json).length > MAX_BACKUP_BYTES) throw new Error('Backup must be under 1 MB.');
  return parseSnapshot(JSON.parse(json));
}
export const exportBackup = snapshot => JSON.stringify({ ...parseSnapshot(snapshot), exportDate: new Date().toISOString() }, null, 2);
export function csvCell(value) {
  let cell = String(value);
  // eslint-disable-next-line no-control-regex -- Leading controls can hide a spreadsheet formula marker.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(cell) || /^[\u0000-\u001f]/.test(cell)) cell = "'" + cell;
  return '"' + cell.replaceAll('"', '""') + '"';
}
