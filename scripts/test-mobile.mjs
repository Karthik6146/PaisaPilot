import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const bridgeUrl = url(`export const state = { native: true, calls: [], response: { status: 200, data: { ok: true } } };
export const Capacitor = { isNativePlatform: () => state.native };
export const CapacitorHttp = { request: async options => { state.calls.push(options); if (state.failure) throw state.failure; return state.response; } };`);
const { state } = await import(bridgeUrl);
const source = ts.transpileModule(readFileSync('src/utils/profileClient.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { request, RequestError } = await import(url(source.replaceAll("'@capacitor/core'", JSON.stringify(bridgeUrl))));

test('Android requests use a fixed HTTPS API, native cookies and existing CSRF protection', async () => {
  assert.deepEqual(await request('save', 'PUT', { revision: 3 }, 'dummy-csrf'), { ok: true });
  const options = state.calls.at(-1);
  assert.equal(options.url, 'https://paisa-pilot-umber.vercel.app/api/index?action=save');
  assert.equal(options.headers.Origin, 'https://paisa-pilot-umber.vercel.app');
  assert.equal(options.headers['X-CSRF-Token'], 'dummy-csrf');
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.equal(options.headers.Cookie, undefined, 'The native cookie jar owns credentials.');
  assert.equal(options.disableRedirects, true, 'Never forward credentials to redirected hosts.');
  assert.equal(options.connectTimeout, 15000);
  assert.deepEqual(options.data, { revision: 3 });
});

test('Android HTTP and connection failures retain actionable errors', async () => {
  state.response = { status: 401, data: { error: 'Sign in again.' } };
  await assert.rejects(request('session'), error => error instanceof RequestError && error.status === 401 && error.message === 'Sign in again.');
  state.response = { status: 503, data: '<html>Unavailable</html>' };
  await assert.rejects(request('session'), error => error.status === 503);
  state.failure = new Error('Network unavailable');
  await assert.rejects(request('session'), error => error.status === 0 && error.message.includes('remain on screen'));
  state.failure = undefined;
});

test('Website retains same-origin fetch and CSRF headers', async t => {
  state.native = false;
  t.after(() => { state.native = true; });
  const fetchMock = t.mock.method(globalThis, 'fetch', async (path, options) => {
    assert.equal(path, '/api/index?action=save');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.headers.Origin, undefined);
    assert.equal(options.headers['X-CSRF-Token'], 'web-csrf');
    return new Response(JSON.stringify({ revision: 4 }));
  });
  assert.deepEqual(await request('save', 'PUT', { revision: 3 }, 'web-csrf'), { revision: 4 });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('Android exports share a private cache file and only remove expired exports', async () => {
  const filesystemUrl = url(`export const Directory = { Cache: 'CACHE' }; export const Encoding = { UTF8: 'utf8' };
    export const calls = []; export const Filesystem = {
      readdir: async () => ({ files: [
        { name: '1-paisapilot_backup.json', type: 'file', mtime: 1 },
        { name: '2-paisapilot-spending.csv', type: 'file', mtime: Date.now() },
        { name: 'unrelated.json', type: 'file', mtime: 1 }
      ] }),
      deleteFile: async options => calls.push(['delete', options]),
      writeFile: async options => { calls.push(['write', options]); return { uri: 'file:///cache/exports/test.json' }; }
    };`);
  const shareUrl = url(`export const calls = []; export const Share = { share: async options => { calls.push(options); } };`);
  let compiled = ts.transpileModule(readFileSync('src/utils/exportFile.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  for (const [name, dependency] of Object.entries({ '@capacitor/core': bridgeUrl, '@capacitor/filesystem': filesystemUrl, '@capacitor/share': shareUrl })) compiled = compiled.replaceAll("'" + name + "'", JSON.stringify(dependency));
  const { exportFile } = await import(url(compiled));
  const filesystem = await import(filesystemUrl), share = await import(shareUrl);
  await exportFile('paisapilot_backup.json', '{"test":true}', 'application/json');
  assert.equal(filesystem.calls.length, 2);
  assert.deepEqual(filesystem.calls[0], ['delete', { path: 'exports/1-paisapilot_backup.json', directory: 'CACHE' }]);
  assert.match(filesystem.calls[1][1].path, /^exports\/\d+-paisapilot_backup.json$/);
  assert.equal(filesystem.calls[1][1].data, '{"test":true}');
  assert.equal(filesystem.calls[1][1].directory, 'CACHE');
  assert.deepEqual(share.calls[0].files, ['file:///cache/exports/test.json']);
});

test('Native theme changes keep the window background and system icons in sync', async t => {
  const themeBridge = url(`export const calls = [];
    export const Capacitor = { isNativePlatform: () => true };
    export const registerPlugin = () => ({ setTheme: async options => calls.push(['background', options.theme]) });
    export const SystemBarsStyle = { Dark: 'DARK', Light: 'LIGHT' };
    export const SystemBars = { setStyle: async options => calls.push(['icons', options.style]) };`);
  const previous = globalThis.document;
  globalThis.document = { documentElement: { dataset: {} } };
  t.after(() => { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; });
  const compiled = ts.transpileModule(readFileSync('src/utils/theme.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  const { applyTheme } = await import(url(compiled.replaceAll("'@capacitor/core'", JSON.stringify(themeBridge))));
  const { calls } = await import(themeBridge);
  applyTheme('dark');
  await new Promise(setImmediate);
  assert.equal(document.documentElement.dataset.theme, 'dark');
  applyTheme('light');
  await new Promise(setImmediate);
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.deepEqual(calls, [['background', 'dark'], ['icons', 'DARK'], ['background', 'light'], ['icons', 'LIGHT']]);
});
