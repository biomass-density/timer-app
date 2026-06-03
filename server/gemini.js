// Portable Gemini call — runs on Node (local dev/server) and on the
// Cloudflare Workers runtime (Pages Functions). The API key is passed in by
// the caller (from process.env on Node, or context.env on Cloudflare); this
// module never reads the environment itself, so it has no Node dependencies.

// "-latest" alias so a retired model never silently breaks this again.
const DEFAULT_MODEL = 'gemini-flash-lite-latest'

const SYSTEM = [
  'You pick a single emoji for a to-do task title.',
  'Read the whole title and choose the one emoji that best represents it',
  '(e.g. "dentist appointment" → 🦷, "pay rent" → 🏠, "grocery run" → 🛒).',
  'Reply with ONLY that one emoji — no words, no quotes, no explanation.',
].join(' ')

// Match an emoji including ZWJ sequences (👨‍👩‍👧) and variation selectors (🏋️).
const EMOJI_RE = /\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/u
function firstEmoji(text) {
  const m = (text || '').match(EMOJI_RE)
  return m ? m[0] : null
}

const cache = new Map()

// Returns an emoji string, or null if no key / blank title / no emoji found.
// Throws on network/HTTP errors so the caller can respond gracefully.
export async function suggestEmoji(title, apiKey, model = DEFAULT_MODEL) {
  const t = (title || '').trim()
  if (!apiKey || !t) return null

  const ck = t.toLowerCase()
  if (cache.has(ck)) return cache.get(ck)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: t }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 16 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
  const data = await res.json()
  const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
  const emoji = firstEmoji(text)
  if (emoji) cache.set(ck, emoji)
  return emoji
}
