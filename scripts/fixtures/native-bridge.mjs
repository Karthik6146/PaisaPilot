// Browser contract test only. Real Android cookie persistence is checked on a device/emulator.
export function nativeBridge(origin) {
  const listeners = new Map();
  let listenerId = 0;
  window.androidBridge = {};
  window.nativeTest = { minimized: 0, events: name => { for (const entry of [...listeners.values()]) if (entry.eventName === name) entry.callback({}); } };
  window.Capacitor = {
    PluginHeaders: [
      { name: 'CapacitorHttp', methods: [{ name: 'request', rtype: 'promise' }] },
      { name: 'SystemBars', methods: [{ name: 'setStyle', rtype: 'promise' }] },
      { name: 'AppAppearance', methods: [{ name: 'setTheme', rtype: 'promise' }] },
      { name: 'Filesystem', methods: [{ name: 'readdir', rtype: 'promise' }] },
      { name: 'App', methods: [{ name: 'addListener', rtype: 'callback' }, { name: 'removeListener', rtype: 'promise' }, { name: 'minimizeApp', rtype: 'promise' }] },
    ],
    nativeCallback(plugin, method, options, callback) {
      if (plugin !== 'App' || method !== 'addListener') throw new Error('Unexpected callback');
      const id = String(++listenerId); listeners.set(id, { ...options, callback }); return id;
    },
    async nativePromise(plugin, method, options) {
      if (plugin === 'CapacitorHttp') {
        const url = new URL(options.url);
        if (url.origin !== 'https://paisa-pilot-umber.vercel.app') throw new Error('Unexpected native API host');
        const { Origin: _origin, ...headers } = options.headers;
        const result = await fetch(origin + url.pathname + url.search, { method: options.method, headers, credentials: 'same-origin', body: options.data === undefined ? undefined : JSON.stringify(options.data) });
        return { status: result.status, data: await result.json() };
      }
      if (plugin === 'App' && method === 'removeListener') listeners.delete(options.callbackId);
      if (plugin === 'App' && method === 'minimizeApp') window.nativeTest.minimized++;
      if (plugin === 'Filesystem') return { files: [] };
      return {};
    },
  };
}
