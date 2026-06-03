import { suggestEmoji } from './gemini.js'

// On Node, the key comes from the environment (loaded from .env in dev/prod).
const getKey = () => process.env.GEMINI_API_KEY
const getModel = () => process.env.GEMINI_MODEL

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise(resolve => {
    let data = ''
    req.on('data', c => { data += c })
    req.on('end', () => resolve(data))
    req.on('error', () => resolve(''))
  })
}

// Handle the two API routes. Returns true if the request was an API route
// (and has been answered), false otherwise so a caller can serve static files.
export async function handleApi(req, res) {
  const urlPath = (req.url || '').split('?')[0]

  // Lets the client know whether the server has a Gemini key configured.
  if (urlPath === '/api/config' && req.method === 'GET') {
    sendJson(res, 200, { aiAvailable: !!getKey() })
    return true
  }

  // title → emoji. Always 200 with { emoji }; null tells the client to keep
  // its offline guess (no key, blank title, or an upstream error).
  if (urlPath === '/api/emoji' && req.method === 'POST') {
    try {
      const { title } = JSON.parse((await readBody(req)) || '{}')
      const emoji = await suggestEmoji(title, getKey(), getModel())
      sendJson(res, 200, { emoji: emoji || null })
    } catch {
      sendJson(res, 200, { emoji: null })
    }
    return true
  }

  return false
}

// Connect/Vite-compatible middleware adapter (used by the dev server).
export function emojiMiddleware(req, res, next) {
  handleApi(req, res).then(handled => { if (!handled) next() }).catch(() => next())
}
