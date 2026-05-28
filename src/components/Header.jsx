import { formatMinutesLabel, formatClock } from '../utils/timeUtils'

export default function Header({ dateLabel, totalListMinutes, endTime, hasActiveTasks }) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="llama-avatar">🦝</span>
        <span className="header-date">{dateLabel}</span>
      </div>
      <div className="header-pills">
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
