// Server-side Gemini call. The API key is read from the environment
// (GEMINI_API_KEY) and never leaves the server.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

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

export function hasKey() {
  return !!process.env.GEMINI_API_KEY
}

// Returns an emoji string, or null if no key / blank title / no emoji found.
// Throws on network/HTTP errors so the caller can respond gracefully.
export async function suggestEmoji(title) {
  const key = process.env.GEMINI_API_KEY
  const t = (title || '').trim()
  if (!key || !t) return null

  const ck = t.toLowerCase()
  if (cache.has(ck)) return cache.get(ck)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`
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
