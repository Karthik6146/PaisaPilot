import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { createHandler } from './server/handler.mjs'
import { readConfig } from './server/auth.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    { name: 'production-content-policy', apply: 'build', transformIndexHtml() {
      // HTTP headers protect the website; this also protects the bundled Android page.
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" }, injectTo: 'head' }];
    } },
    { name: 'workspace-api', configureServer(server) {
      const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
      server.middlewares.use('/api/index', createHandler({ config: () => readConfig(env) }));
    } },
  ],
}))
