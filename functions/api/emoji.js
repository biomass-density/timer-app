// Cloudflare Pages Function — POST /api/emoji
// Reads the GEMINI_API_KEY secret from the Pages dashboard via context.env.
// The key stays on Cloudflare's edge; the browser only ever sees the emoji.
import { suggestEmoji } from '../../server/gemini.js'

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json' },
  })
}

export async function onRequestPost(context) {
  const debug = new URL(context.request.url).searchParams.has('debug')
  try {
    const { title } = await context.request.json()

    if (debug) {
      // TEMP: list the models this key can actually use (newest flash first).
      const key = context.env.GEMINI_API_KEY
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`)
      const data = await r.json()
      const models = (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''))
      return json({ status: r.status, flash: models.filter(m => m.includes('flash')), all: models })
    }

    const emoji = await suggestEmoji(title, context.env.GEMINI_API_KEY, context.env.GEMINI_MODEL)
    return json({ emoji: emoji || null })
  } catch (e) {
    if (debug) return json({ error: String((e && e.stack) || e) })
    // No key, upstream error, bad body → tell the client to keep its offline guess.
    return json({ emoji: null })
  }
}
