import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './env.js'
import { handleApi } from './emojiApi.js'

loadEnvFile() // read GEMINI_API_KEY (etc.) from .env into process.env

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '../dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
}

export function createServer() {
  return http.createServer(async (req, res) => {
    // API routes first
    if (await handleApi(req, res)) return

    // Static files from dist/, with SPA fallback to index.html
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath)
    if (!filePath.startsWith(DIST)) { // guard against path traversal
      res.statusCode = 403
      res.end('Forbidden')
      return
    }
    if (!existsSync(filePath)) filePath = path.join(DIST, 'index.html')
    try {
      const data = await readFile(filePath)
      res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream')
      res.end(data)
    } catch {
      res.statusCode = 404
      res.end('Not found')
    }
  })
}

// Start only when run directly (not when imported by a test).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const PORT = parseInt(process.env.PORT || '3000', 10)
  createServer().listen(PORT, () => {
    console.log(`Focus Timer running at http://localhost:${PORT}`)
    console.log(`AI emoji: ${process.env.GEMINI_API_KEY ? 'enabled (Gemini key found)' : 'off (no GEMINI_API_KEY in .env)'}`)
  })
}
