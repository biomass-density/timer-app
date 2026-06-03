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
      // TEMP: surface exactly what Gemini returns (no key leaked).
      const key = context.env.GEMINI_API_KEY
      const model = context.env.GEMINI_MODEL || 'gemini-2.0-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with ONLY one emoji for: ' + title }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 16 },
        }),
      })
      const body = await res.text()
      return json({ status: res.status, model, hasKey: !!key, body: body.slice(0, 900) })
    }

    const emoji = await suggestEmoji(title, context.env.GEMINI_API_KEY, context.env.GEMINI_MODEL)
    return json({ emoji: emoji || null })
  } catch (e) {
    if (debug) return json({ error: String((e && e.stack) || e) })
    // No key, upstream error, bad body → tell the client to keep its offline guess.
    return json({ emoji: null })
  }
}
