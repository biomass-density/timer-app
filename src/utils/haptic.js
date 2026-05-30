export function haptic(pattern = 10) {
  try { if (navigator.vibrate) navigator.vibrate(pattern) } catch {}
}
