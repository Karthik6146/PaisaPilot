// Regenerates README screenshots from fictional demo data. Run `npm run build` first.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHandler } from '../server/handler.mjs';
import { memoryStore } from './fixtures/profile-store.mjs';

const store = memoryStore();
const cfg = { origin: '', production: false, invite: '102030', secret: 'readme-demo-secret-'.repeat(3), database: 'unused' };
const api = createHandler({ store, config: () => cfg });
const root = path.resolve('dist');
const types = { '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/api/index')) return api(req, res);
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://demo').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const content = await readFile(file);
    res.setHeader('Content-Type', types[path.extname(file)] || 'text/html'); res.end(content);
  } catch { res.statusCode = 404; res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
cfg.origin = 'http://127.0.0.1:' + server.address().port;

const month = '2026-10';
let n = 0;
const tx = (type, amount, category, note, day, paymentMode = 'UPI (GPay/PhonePe)') => ({ id: 'tx' + ++n, type, amount, category, note, date: `${month}-${day}`, paymentMode, createdAt: n });
const demo = {
  transactions: [
    tx('income', 1500, 'Gift', 'Diwali money from Nani', '20'),
    tx('expense', 180, 'Food', 'Canteen lunch', '02'), tx('expense', 60, 'Transport', 'Auto to college', '03', 'Cash'),
    tx('expense', 450, 'Books', 'Data structures notes', '05'), tx('expense', 120, 'Food', 'Chai & samosa', '07', 'Cash'),
    tx('expense', 299, 'Entertainment', 'Movie night', '11'), tx('expense', 240, 'Food', 'Pizza with friends', '14'),
    tx('expense', 80, 'Transport', 'Metro card top-up', '16'), tx('expense', 199, 'Recharge', 'Mobile recharge', '18'),
    tx('expense', 350, 'Food', 'Weekly groceries', '21'), tx('expense', 150, 'Transport', 'Cab home', '24'),
    tx('expense', 90, 'Food', 'Cold coffee', '26', 'Cash'),
  ],
  loans: [
    { id: 'l1', type: 'lent', personName: 'Rohan', originalAmount: 500, dateTaken: `${month}-10`, dueDate: '2026-11-05', note: 'Concert ticket', isSettled: false, createdAt: 1, payments: [{ id: 'p1', amount: 200, date: `${month}-22`, note: 'UPI' }] },
    { id: 'l2', type: 'borrowed', personName: 'Priya', originalAmount: 300, dateTaken: `${month}-15`, dueDate: '2026-10-31', note: 'Lab manual', isSettled: false, createdAt: 2, payments: [] },
  ],
  budget: {
    monthlyTarget: 0, categories: {},
    months: { [month]: { monthlyTarget: 5000, categories: { Food: 1800, Transport: 600, Books: 800, Entertainment: 600, Recharge: 300 } } },
    priorities: [
      { id: 'pr1', month, title: 'Semester exam fee', amount: 800, category: 'Books', priority: 'Must have' },
      { id: 'pr2', month, title: 'New earphones', amount: 650, category: 'Entertainment', priority: 'Can wait' },
    ],
    notes: [{ id: 'n1', month, text: 'Skip food delivery this week — cook with roommates.', pinned: true }],
  },
  settings: { theme: 'light', currency: 'INR', currencySymbol: '₹', userName: 'Aarav Demo', monthlyAllowance: 0, soundEnabled: false },
};

const out = 'docs/images';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, timezoneId: 'Asia/Kolkata' });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-10-27T12:00:00+05:30'));
  page.on('dialog', dialog => dialog.accept());
  const shot = async name => { if (name !== 'sign-in') await page.getByText('Saved to your profile').first().waitFor(); await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); }); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${name}.png` }); };
  const go = label => page.getByRole('button', { name: label, exact: true }).first().click();

  await page.goto(cfg.origin); await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
  await shot('sign-in');
  await page.getByRole('button', { name: 'Create a profile', exact: true }).click();
  await page.getByLabel('Invite code').fill(cfg.invite); await page.getByLabel('Username', { exact: true }).fill('aarav');
  await page.getByLabel('Password', { exact: true }).fill('demo-password-123'); await page.getByLabel('Profile name').fill('Aarav Demo');
  await page.getByRole('button', { name: 'Create my profile' }).click(); await page.getByRole('heading', { name: 'Your money, at a glance.' }).waitFor();
  const [profile] = store.profiles.values(); profile.data = structuredClone(demo); profile.revision++;
  await page.reload(); await page.getByRole('heading', { name: 'Your money, at a glance.' }).waitFor();

  await shot('dashboard-light');
  await go('Spending history'); await shot('history');
  await go('Monthly budget'); await shot('budget');
  await go('Calculators'); await page.getByRole('button', { name: 'Everyday spending' }).click(); await shot('calculators');
  await go('Lend & borrow'); await shot('debts');
  await go('Dashboard'); await page.getByRole('button', { name: 'Switch to dark mode' }).first().click(); await shot('dashboard-dark');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to light mode' }).first().click(); await shot('mobile-light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).first().click(); await shot('mobile-dark');
} finally { await browser.close(); server.close(); }
console.log('Saved README images to', out);
