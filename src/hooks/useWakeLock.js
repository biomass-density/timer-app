import { useEffect } from 'react'

// Hold a screen wake lock while `active` is true, keeping the display from
// dimming/sleeping. Wake locks get auto-released on lots of transitions —
// page hidden, tab switch, and notably ORIENTATION CHANGE on iOS — and some
// browsers only grant one after a user gesture. So we re-acquire on every
// event that can drop it (rotate, resize, refocus, tap) plus a short poll as a
// safety net, so "always on" survives rotating the phone.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel = null
    let acquiring = false
    let cancelled = false

    async function acquire() {
      if (cancelled || sentinel || acquiring || document.visibilityState !== 'visible') return
      acquiring = true
      try {
        sentinel = await navigator.wakeLock.request('screen')
        sentinel.addEventListener('release', () => { sentinel = null })
      } catch {
        sentinel = null // not available / denied / no activation yet — retry on next event
      } finally {
        acquiring = false
      }
    }

    acquire()

    const reacquire = () => acquire()
    const orientation = window.screen && window.screen.orientation
    document.addEventListener('visibilitychange', reacquire)
    window.addEventListener('focus', reacquire)
    window.addEventListener('orientationchange', reacquire)
    window.addEventListener('resize', reacquire)
    window.addEventListener('pointerdown', reacquire)
    window.addEventListener('keydown', reacquire)
    orientation?.addEventListener?.('change', reacquire)

    // Safety net: re-grab the lock quickly if it's ever dropped while we still
    // want it (well before the screen would auto-lock). No-op while it's held.
    const poll = setInterval(reacquire, 5000)

    return () => {
      cancelled = true
      clearInterval(poll)
      document.removeEventListener('visibilitychange', reacquire)
      window.removeEventListener('focus', reacquire)
      window.removeEventListener('orientationchange', reacquire)
      window.removeEventListener('resize', reacquire)
      window.removeEventListener('pointerdown', reacquire)
      window.removeEventListener('keydown', reacquire)
      orientation?.removeEventListener?.('change', reacquire)
      sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
