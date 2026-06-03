import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// Minimal .env loader (no dependency). Populates process.env from a .env file
// without overriding variables already set in the real environment.
export function loadEnvFile(file = '.env') {
  const p = path.resolve(process.cwd(), file)
  if (!existsSync(p)) return
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}
