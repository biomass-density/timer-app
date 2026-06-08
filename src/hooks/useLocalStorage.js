import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Persist, and let the cloud-sync layer know something changed locally.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      window.dispatchEvent(new Event('ft-local-change'))
    } catch (e) {
      if (import.meta.env.DEV) console.warn('localStorage write failed:', e)
    }
  }, [key, value])

  // Re-read when the cloud-sync layer writes fresh data into localStorage.
  useEffect(() => {
    function onPull() {
      try {
        const item = localStorage.getItem(key)
        const next = item !== null ? JSON.parse(item) : initialValue
        setValue(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      } catch {}
    }
    window.addEventListener('ft-sync-pull', onPull)
    return () => window.removeEventListener('ft-sync-pull', onPull)
    // initialValue is stable per key; intentionally not a dependency
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue]
}
