// Bridges localStorage app state with the cloud. Every `ft_*` localStorage
// entry is already a JSON string, so we store each one verbatim in the user's
// Firestore document under a `data` map — no re-serialization, no Firestore
// nested-array headaches.

const APP_PREFIX = 'ft_'
const TS_KEY = '__cloudsync_ts' // this device's last-synced data timestamp (not synced itself)

// Snapshot of all syncable localStorage entries → { key: rawJsonString }.
export function readLocalData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(APP_PREFIX)) data[key] = localStorage.getItem(key)
  }
  return data
}

// Stable, order-independent fingerprint for change detection.
export function fingerprint(data) {
  return JSON.stringify(Object.keys(data).sort().map(k => [k, data[k]]))
}

// Write cloud data into localStorage and notify the hooks to re-read.
// Returns true if anything actually changed.
export function applyRemoteData(data) {
  let changed = false
  for (const [key, val] of Object.entries(data || {})) {
    if (typeof val !== 'string' || !key.startsWith(APP_PREFIX)) continue
    if (localStorage.getItem(key) !== val) {
      localStorage.setItem(key, val)
      changed = true
    }
  }
  if (changed) window.dispatchEvent(new Event('ft-sync-pull'))
  return changed
}

export function getLocalTs() {
  return Number(localStorage.getItem(TS_KEY) || 0)
}
export function setLocalTs(ts) {
  localStorage.setItem(TS_KEY, String(ts))
}
