import { useEffect, useRef } from 'react'

export function useWakeLock() {
  const lockRef = useRef(null)

  async function acquire() {
    try {
      if ('wakeLock' in navigator) {
        lockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Not available or denied — silent fail
    }
  }

  useEffect(() => {
    acquire()

    function onVisibility() {
      if (document.visibilityState === 'visible') acquire()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      lockRef.current?.release().catch(() => {})
    }
  }, [])
}
