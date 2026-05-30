import { formatMinutesLabel, formatClock } from '../utils/timeUtils'

function fmtDone(seconds) {
  if (seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export default function Header({ dateLabel, totalListMinutes, endTime, hasActiveTasks, doneToday }) {
  const doneLabel = fmtDone(doneToday)
  return (
    <header className="header">
      <div className="header-left">
        <span className="llama-avatar">🦝</span>
        <span className="header-date">{dateLabel}</span>
      </div>
      <div className="header-pills">
        {doneLabel && (
          <div className="header-pill header-pill--done">
            <span className="pill-val">{doneLabel}</span>
            <span className="pill-caption">done today</span>
          </div>
        )}
        <div className="header-pill">
          <span className="pill-val">{formatMinutesLabel(totalListMinutes)}</span>
          <span className="pill-caption">list time</span>
        </div>
        <div className="header-pill">
          <span className="pill-val">{hasActiveTasks ? formatClock(endTime) : '—'}</span>
          <span className="pill-caption">end time</span>
        </div>
      </div>
    </header>
  )
}
