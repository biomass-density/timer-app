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
  try {
    const { title } = await context.request.json()
    const emoji = await suggestEmoji(title, context.env.GEMINI_API_KEY, context.env.GEMINI_MODEL)
    return json({ emoji: emoji || null })
  } catch {
    // No key, upstream error, bad body → tell the client to keep its offline guess.
    return json({ emoji: null })
  }
}
