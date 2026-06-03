// Contextual emoji suggestions via the Google Gemini API.
// Used as the "refine" step of the hybrid matcher: getAutoEmoji() gives an
// instant offline guess, then this upgrades it by actually reading the task.

const GEMINI_MODEL = 'gemini-2.0-flash' // cheap + fast; change here to use another
const endpoint = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`

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

// Avoid re-asking for titles we've already resolved (and de-dupe in-flight calls).
const cache = new Map()
const inflight = new Map()

async function callGemini(title, apiKey, signal) {
  // Self-timeout if the caller didn't pass an AbortSignal, so a hung request
  // never blocks the refine forever.
  const ctrl = signal ? null : new AbortController()
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null
  try {
    const res = await fetch(endpoint(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: title }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 16 },
      }),
      signal: signal || ctrl?.signal,
    })
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
    return firstEmoji(text)
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// Resolve a title to an emoji via Gemini, or null if no key / blank / unmatched.
// Throws on network/API errors so callers can fall back to the offline guess.
export function suggestEmojiAI(title, apiKey, signal) {
  const key = (title || '').trim().toLowerCase()
  if (!key || !apiKey) return Promise.resolve(null)
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (inflight.has(key)) return inflight.get(key)

  const p = callGemini(title.trim(), apiKey, signal)
    .then(emoji => { if (emoji) cache.set(key, emoji); return emoji })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
