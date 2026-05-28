export function formatMMSS(totalSeconds) {
  const abs = Math.abs(Math.floor(totalSeconds))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  const sign = totalSeconds < 0 ? '-' : ''
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatHMMSS(totalSeconds) {
  const abs = Math.abs(Math.floor(totalSeconds))
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  const sign = totalSeconds < 0 ? '-' : ''
  if (h > 0) return `${sign}${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatMinutesLabel(minutes) {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function formatClock(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDuration(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Compute the projected end time given remaining seconds from now
export function projectedEndTime(remainingSeconds) {
  return new Date(Date.now() + remainingSeconds * 1000)
}
