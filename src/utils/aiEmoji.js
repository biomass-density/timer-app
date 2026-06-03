// Contextual emoji suggestions via the app's own backend (/api/emoji).
// The Gemini key lives on the server — the browser never sees it.
// Used as the "refine" step of the hybrid matcher: getAutoEmoji() gives an
// instant offline guess, then this upgrades it by actually reading the task.

const cache = new Map()
const inflight = new Map()

// Resolve a title to an emoji, or null (no emoji / offline / server error).
// Never throws — callers keep the offline guess when this returns null.
export function suggestEmojiAI(title) {
  const key = (title || '').trim().toLowerCase()
  if (!key) return Promise.resolve(null)
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (inflight.has(key)) return inflight.get(key)

  const p = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    try {
      const res = await fetch('/api/emoji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
        signal: ctrl.signal,
      })
      if (!res.ok) return null
      const { emoji } = await res.json()
      if (emoji) cache.set(key, emoji)
      return emoji || null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

// Whether the server has a Gemini key configured (for the settings status line).
export async function aiAvailable() {
  try {
    const res = await fetch('/api/config')
    if (!res.ok) return false
    const { aiAvailable } = await res.json()
    return !!aiAvailable
  } catch {
    return false
  }
}
