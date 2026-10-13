import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { _android } from 'playwright';
import { databaseClient } from '../server/store.mjs';

// Explicit opt-in: creates one disposable cloud profile; never tests against an owner's records.
assert.equal(process.env.PAISAPILOT_LIVE_ANDROID_TEST, '1', 'Set PAISAPILOT_LIVE_ANDROID_TEST=1 to run the emulator/cloud smoke test.');
process.loadEnvFile('.env.local');
const username = 'android_verify_' + randomBytes(5).toString('hex');
const password = randomBytes(24).toString('hex');
const sql = databaseClient(process.env.DATABASE_URL);
const devices = await _android.devices();
const device = devices.find(item => item.serial().startsWith('emulator-'));
assert.ok(device, 'Start a dedicated Android emulator first.');
device.setDefaultTimeout(45000);
const pkg = 'com.karthik.paisapilot';
let page;
async function open() {
  await device.shell(`am start -n ${pkg}/.MainActivity`);
  const pid = (await device.shell(`pidof ${pkg}`)).toString().trim();
  const view = await device.webView({ pkg, socketName: 'webview_devtools_remote_' + pid });
  page = await view.page(); page.setDefaultTimeout(45000);
}
const saved = () => page.getByRole('status').filter({ hasText: 'Saved to your profile' }).waitFor();
async function waitForActivity(name) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const activity = (await device.shell('dumpsys activity activities')).toString();
    if (activity.split('\n').some(line => line.includes('topResumedActivity') && line.includes(name))) return;
    await delay(250);
  }
  throw new Error('Android did not show expected activity: ' + name);
}
try {
  await device.shell(`am force-stop ${pkg}`);
  await open();
  await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
  await page.getByRole('button', { name: 'Create a profile', exact: true }).click();
  await page.getByLabel('Invite code').fill(process.env.INVITE_CODE);
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Profile name').fill('Android test profile');
  await page.getByRole('button', { name: 'Create my profile' }).click();
  await page.getByRole('heading', { name: 'Your money, at a glance.' }).waitFor();
  console.log('Native registration passed.');
  await page.getByRole('button', { name: 'Set your monthly budget' }).click();
  await page.getByLabel('Monthly pocket money').fill('5000');
  await page.getByRole('button', { name: 'Save monthly budget' }).click(); await saved();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('heading', { name: 'Your money, at a glance.' }).waitFor();
  await page.getByRole('button', { name: 'Add money received', exact: true }).click();
  await page.getByLabel('Amount').fill('500');
  await page.getByLabel('Category', { exact: true }).fill('Gift');
  await page.getByRole('button', { name: 'Save money received', exact: true }).click(); await saved();
  await page.getByRole('button', { name: 'Add expense', exact: true }).click();
  await page.getByLabel('Amount').fill('100');
  await page.getByLabel('Category', { exact: true }).fill('Food');
  await page.getByRole('button', { name: 'Save expense', exact: true }).click(); await saved();
  assert.equal(await page.locator('.balance-value').textContent(), '\u20b95,400');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click(); await saved();
  await mkdir('docs/screenshots', { recursive: true });
  await device.screenshot({ path: 'docs/screenshots/android-dashboard.png' });
  console.log('Native budget, receipt, expense and dark mode passed.');
  await device.shell(`am force-stop ${pkg}`);
  await open();
  await page.getByRole('heading', { name: 'Your money, at a glance.' }).waitFor();
  assert.equal(await page.locator('.balance-value').textContent(), '\u20b95,400', 'Native cookie and financial data must survive process restart.');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await page.evaluate(() => document.cookie.includes('paisapilot_session')), false, 'HttpOnly credentials must not be readable through document.cookie.');
  await page.getByRole('button', { name: 'Spending history', exact: true }).click();
  await device.shell('input keyevent KEYCODE_BACK');
  await page.getByRole('heading', { name: 'Your money, at a glance.' }).waitFor();
  await page.getByRole('button', { name: 'Open profile settings' }).click();
  await page.getByRole('button', { name: 'Export backup' }).click();
  await waitForActivity('com.android.intentresolver/');
  await device.shell('input keyevent KEYCODE_BACK');
  await waitForActivity(pkg + '/.MainActivity');
  await page.getByRole('button', { name: 'Close settings' }).click();
  // Remove only this random test profile through the same authenticated native transport.
  const removed = await page.evaluate(async ({ password }) => {
    const origin = 'https://paisa-pilot-umber.vercel.app';
    const current = await window.Capacitor.Plugins.CapacitorHttp.request({ url: origin + '/api/index?action=session', method: 'GET', headers: { Origin: origin } });
    const result = await window.Capacitor.Plugins.CapacitorHttp.request({ url: origin + '/api/index?action=delete', method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': current.data.csrf }, data: { password } });
    return result.status;
  }, { password });
  assert.equal(removed, 200);
  await device.shell(`am force-stop ${pkg}`); await open();
  await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
  console.log('Android runtime checks passed: real HTTPS signup, budget/receipts/expenses, native Back, dark mode, restart/session persistence, HttpOnly cookie and profile deletion.');
} catch (error) {
  throw new Error(String(error.message).replaceAll(process.env.INVITE_CODE, '[redacted]').replaceAll(password, '[redacted]'));
} finally {
  await sql`DELETE FROM paisapilot.profiles WHERE username = ${username}`;
  await sql.end();
  await device.close();
  console.log('Disposable Android test profile removed.');
}
