import { useEffect, useRef } from 'react'
import { subscribeToPush, unsubscribeFromPush } from '../lib/pushNotifications'
import { saveNotifyDoc, updateNotifyTimer, deleteNotifyDoc } from '../lib/firebase'

// Registers/unregisters push subscriptions when the toggle changes,
// and keeps activeNotifications/{uid} in sync with the live timer state
// so the notify worker can calculate remaining time every 5 minutes.
export function useTimerNotifications({ user, enabled, setEnabled, timerState, activeTask }) {
  const prevEnabled = useRef(enabled)

  // Subscribe or unsubscribe when the toggle flips
  useEffect(() => {
    if (prevEnabled.current === enabled) return
    prevEnabled.current = enabled

    if (!user) {
      setEnabled(false)
      return
    }

    if (enabled) {
      if (!('serviceWorker' in navigator)) {
        alert('Your browser does not support push notifications.')
        setEnabled(false)
        return
      }
      subscribeToPush()
        .then(sub => saveNotifyDoc(user.uid, sub))
        .catch(err => {
          alert(err.message)
          setEnabled(false)
        })
    } else {
      unsubscribeFromPush().catch(() => {})
      deleteNotifyDoc(user.uid).catch(() => {})
    }
  }, [enabled, user, setEnabled])

  // Keep timer state synced to Firestore whenever notifications are on
  useEffect(() => {
    if (!user || !enabled) return
    updateNotifyTimer(user.uid, {
      isRunning: timerState.isRunning,
      taskTitle: activeTask?.title ?? null,
      taskEmoji: activeTask?.emoji ?? null,
      durationMinutes: activeTask?.durationMinutes ?? null,
      startTimestamp: timerState.startTimestamp ?? null,
      accumulatedSeconds: timerState.accumulatedSeconds ?? 0,
    }).catch(() => {})
  }, [
    user, enabled,
    timerState.isRunning, timerState.startTimestamp, timerState.accumulatedSeconds,
    activeTask?.id,
  ])
}
