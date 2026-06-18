// Cloudflare Worker — fires every 5 minutes via Cron Trigger.
// Queries Firestore for users with running timers + notifications enabled,
// calculates how many minutes remain, and sends a web push to each device.
//
// Required env vars (set in Cloudflare dashboard → Workers → Settings → Variables):
//   VAPID_PUBLIC_KEY      — base64url uncompressed EC point
//   VAPID_PRIVATE_KEY_JWK — JSON string of the P-256 private key JWK
//   VAPID_EMAIL           — e.g. "you@example.com"  (used in VAPID sub claim)

import { sendWebPush } from './push.js'

const FIREBASE_PROJECT = 'timer-app-d3ada'
const FIREBASE_API_KEY = 'AIzaSyAf-R9EzVmyd8p6xsuHAhFWDQRMZH3z5cY'
const FIRESTORE_BASE   = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`

// Parse a Firestore REST API field value into a JS primitive
function fv(field) {
  if (!field) return null
  if ('stringValue'  in field) return field.stringValue
  if ('booleanValue' in field) return field.booleanValue
  if ('integerValue' in field) return Number(field.integerValue)
  if ('doubleValue'  in field) return Number(field.doubleValue)
  if ('nullValue'    in field) return null
  return null
}

export default {
  async scheduled(_event, env, _ctx) {
    // Query activeNotifications where isRunning == true
    const res = await fetch(
      `${FIRESTORE_BASE}:runQuery?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'activeNotifications' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'isRunning' },
                op: 'EQUAL',
                value: { booleanValue: true },
              },
            },
          },
        }),
      }
    )

    if (!res.ok) {
      console.error('Firestore query failed:', res.status, await res.text())
      return
    }

    const rows = await res.json()
    const now  = Date.now()

    for (const { document: d } of rows) {
      if (!d?.fields) continue

      const sub = (() => {
        try { return JSON.parse(fv(d.fields.pushSubscription) || 'null') } catch { return null }
      })()
      if (!sub?.endpoint || !sub?.keys?.p256dh) continue

      const startTimestamp     = fv(d.fields.startTimestamp)     ?? 0
      const accumulatedSeconds = fv(d.fields.accumulatedSeconds) ?? 0
      const durationMinutes    = fv(d.fields.durationMinutes)    ?? 25
      const taskTitle          = fv(d.fields.taskTitle)          ?? 'Task'
      const taskEmoji          = fv(d.fields.taskEmoji)          ?? '⏱️'

      const elapsedSec    = accumulatedSeconds + (now - startTimestamp) / 1000
      const remainingSec  = durationMinutes * 60 - elapsedSec
      const remainingMins = Math.ceil(remainingSec / 60)

      const title = remainingSec <= 0
        ? `${taskEmoji} Time's up!`
        : remainingMins === 1
          ? `${taskEmoji} 1 minute left`
          : `${taskEmoji} ${remainingMins} minutes left`
      const body = taskTitle

      try {
        await sendWebPush(
          sub,
          JSON.stringify({ title, body }),
          env.VAPID_PRIVATE_KEY_JWK,
          env.VAPID_PUBLIC_KEY,
          env.VAPID_EMAIL || 'focus@timer.app',
        )
        console.log(`Notified: ${title} — ${body}`)
      } catch (e) {
        // 404/410 = subscription expired; log and move on
        console.error('Push failed:', e.message, e.status)
      }
    }
  },
}
