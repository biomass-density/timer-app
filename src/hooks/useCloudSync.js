import { useEffect, useRef } from 'react'
import { watchUserDoc, pushUserDoc } from '../lib/firebase'
import { readLocalData, fingerprint, applyRemoteData, getLocalTs, setLocalTs } from '../lib/sync'

const PUSH_DEBOUNCE = 1500

// While `user` is signed in: keep this device's localStorage state and the
// user's Firestore document in sync (last-write-wins by timestamp). No-op when
// signed out, so the app stays fully usable offline / without an account.
export function useCloudSync(user) {
  const syncedFp = useRef(null) // fingerprint of the data we last agreed on with the cloud

  useEffect(() => {
    if (!user) { syncedFp.current = null; return }
    const uid = user.uid
    let stopped = false
    let pushTimer = null

    function push() {
      const data = readLocalData()
      const fp = fingerprint(data)
      if (fp === syncedFp.current) return // nothing new
      syncedFp.current = fp
      const ts = Date.now()
      setLocalTs(ts)
      pushUserDoc(uid, { v: 1, updatedAt: ts, data }).catch(() => {})
    }
    function schedulePush() {
      clearTimeout(pushTimer)
      pushTimer = setTimeout(push, PUSH_DEBOUNCE)
    }

    const unsub = watchUserDoc(uid, (remote, isEcho) => {
      if (stopped || isEcho) return
      if (!remote || !remote.data) { push(); return } // cloud empty → seed from this device
      const remoteFp = fingerprint(remote.data)
      if (remoteFp === syncedFp.current) return
      if ((remote.updatedAt || 0) >= getLocalTs()) {
        // remote is newer (or this device has no synced baseline) → take it
        applyRemoteData(remote.data)
        syncedFp.current = remoteFp
        setLocalTs(remote.updatedAt || Date.now())
      } else {
        push() // local changes are newer → push them up
      }
    })

    const onLocalChange = () => schedulePush()
    window.addEventListener('ft-local-change', onLocalChange)

    return () => {
      stopped = true
      clearTimeout(pushTimer)
      window.removeEventListener('ft-local-change', onLocalChange)
      unsub()
    }
  }, [user])
}
