// Client-side push subscription management.
// The VAPID public key is safe to ship in client code.
const VAPID_PUBLIC_KEY = 'BMU7Qoif8ubz7r9rM8Igp47riBK8xpF16OBVxJ36VtbLBF3VdrhYg7Hj_9Liyach_iYBc39kAiwh_NQMZ5SfD-U'

function urlBase64ToUint8Array(b64u) {
  const padding = '='.repeat((4 - b64u.length % 4) % 4)
  const base64 = (b64u + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported on this browser/OS.')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.')
  }
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  return sub.toJSON()
}

export async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
  } catch {}
}
