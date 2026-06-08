import { useEffect } from 'react'

// Hold a screen wake lock while `active` is true, keeping the display from
// dimming/sleeping. Wake locks get auto-released whenever the page is hidden
// (tab switch, screen off) and some browsers only grant one after a user
// gesture — so we re-acquire on visibility changes and on the first taps.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel = null
    let cancelled = false

    async function acquire() {
      if (cancelled || sentinel || document.visibilityState !== 'visible') return
      try {
        sentinel = await navigator.wakeLock.request('screen')
        // Cleared when the OS releases it (e.g. page hidden) so we can re-acquire.
        sentinel.addEventListener('release', () => { sentinel = null })
      } catch {
        sentinel = null // not available / denied / no activation yet — retry on next event
      }
    }

    acquire()

    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }
    const onGesture = () => acquire() // a tap/keypress provides activation if it was needed

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
      sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
