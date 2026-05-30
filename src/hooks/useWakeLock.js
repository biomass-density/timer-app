import { useEffect, useRef } from 'react'

export function useWakeLock(active) {
  const lockRef = useRef(null)

  useEffect(() => {
    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          lockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Not available or denied — silent fail
      }
    }

    async function release() {
      try {
        await lockRef.current?.release()
        lockRef.current = null
      } catch {}
    }

    if (active) {
      acquire()
    } else {
      release()
    }

    // Re-acquire if the page becomes visible again while the timer is running
    function onVisibility() {
      if (document.visibilityState === 'visible' && active) acquire()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      lockRef.current?.release().catch(() => {})
    }
  }, [active])
}
