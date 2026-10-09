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
    { name: 'workspace-api', configureServer(server) {
      const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
      server.middlewares.use('/api/index', createHandler({ config: () => readConfig(env) }));
    } },
  ],
}))
