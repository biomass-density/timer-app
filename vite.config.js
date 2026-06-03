import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnvFile } from './server/env.js'
import { emojiMiddleware } from './server/emojiApi.js'

// Make GEMINI_API_KEY available to the dev/preview API middleware.
loadEnvFile()

// Serves the /api/emoji + /api/config routes from inside the Vite dev server,
// so `npm run dev` runs the whole app (frontend + backend) in one process.
const emojiApiPlugin = {
  name: 'emoji-api',
  configureServer(server) { server.middlewares.use(emojiMiddleware) },
  configurePreviewServer(server) { server.middlewares.use(emojiMiddleware) },
}

export default defineConfig({
  plugins: [react(), emojiApiPlugin],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    host: true,
  },
})
