import { formatMinutesLabel, formatClock } from '../utils/timeUtils'

function formatDur(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// Returns YYYY-MM-DD in the user's local timezone (toISOString() uses UTC and
// causes sessions near midnight to appear under the wrong calendar day).
function localDateStr(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtDateLabel(dateStr) {
  const today = localDateStr(Date.now())
  const yesterday = localDateStr(Date.now() - 86400000)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function ListView({ tasks, sessions, totalListMinutes, endTime, incompleteTasks, timerState, elapsed }) {
  const completed = tasks.filter(t => t.completed)
  const incomplete = tasks.filter(t => !t.completed)

  // Group sessions from the past 7 days (excluding today — today shown in task tables)
  const today = localDateStr(Date.now())
  const cutoff = Date.now() - 7 * 86400000
  const historySessions = sessions
    .filter(s => s.startTime >= cutoff && localDateStr(s.startTime) !== today)
    .sort((a, b) => b.startTime - a.startTime)

  // Group by date
  const historyByDay = []
  const seen = {}
  for (const s of historySessions) {
    const d = localDateStr(s.startTime)
    if (!seen[d]) { seen[d] = []; historyByDay.push({ date: d, sessions: seen[d] }) }
    seen[d].push(s)
  }

  return (
    <div className="list-view">
      {/* Completed table */}
      {completed.length > 0 ? (
        <div className="lv-card">
          <h2 className="lv-heading">Completed</h2>
          <div className="lv-table">
            <div className="lv-header-row">
              <span className="lv-col-name" />
              <span className="lv-col-set">Set</span>
              <span className="lv-col-spent">Spent</span>
            </div>
            {completed.map(task => {
              const plannedSec = task.durationMinutes * 60
              const actualSec = task.actualSeconds ?? 0
              return (
                <div key={task.id} className="lv-row">
                  <span className="lv-col-name">
                    <span className="lv-emoji">{task.emoji}</span>
                    {task.title}
                  </span>
                  <span className="lv-col-set">{formatDur(plannedSec)}</span>
                  <span className="lv-col-spent">{formatDur(actualSec)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="lv-card lv-empty">
          <div className="lv-empty-icon">📋</div>
          <p>No completed tasks yet.<br />Finish a task to see it here.</p>
        </div>
      )}

      {/* Upcoming */}
      {incomplete.length > 0 && (
        <div className="lv-card">
          <h2 className="lv-heading">Up next</h2>
          <div className="lv-table">
            <div className="lv-header-row">
              <span className="lv-col-name" />
              <span className="lv-col-set">Set</span>
              <span className="lv-col-spent">Spent</span>
            </div>
            {incomplete.map(task => {
              const plannedSec = task.durationMinutes * 60
              const isActive = task.id === timerState?.activeTaskId
              // Show live elapsed for the active task; fall back to saved actualSeconds
              const actualSec = isActive ? Math.max(0, elapsed ?? 0) : (task.actualSeconds ?? 0)
              return (
                <div key={task.id} className="lv-row">
                  <span className="lv-col-name">
                    <span className="lv-emoji">{task.emoji}</span>
                    {task.title}
                  </span>
                  <span className="lv-col-set">{formatDur(plannedSec)}</span>
                  <span className="lv-col-spent">{actualSec > 0 ? formatDur(actualSec) : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer summary */}
      <div className="lv-footer">
        <div className="lv-footer-pill">
          <span className="lv-footer-icon">⏱️</span>
          <span className="lv-footer-label">List time:</span>
          <span className="lv-footer-val">{formatMinutesLabel(totalListMinutes)}</span>
        </div>
        <div className="lv-footer-pill">
          <span className="lv-footer-icon">🎉</span>
          <span className="lv-footer-label">End time:</span>
          <span className="lv-footer-val">
            {incompleteTasks.length > 0 ? formatClock(endTime) : '—'}
          </span>
        </div>
      </div>

      {/* Historical sessions — past 7 days */}
      {historyByDay.length > 0 && (
        <div className="lv-card">
          <h2 className="lv-heading">Past sessions</h2>
          {historyByDay.map(({ date, sessions: daySessions }) => (
            <div key={date}>
              <div className="lv-history-day">{fmtDateLabel(date)}</div>
              {daySessions.map(s => (
                <div key={s.id} className="lv-history-row">
                  <span className="lv-history-emoji">{s.taskEmoji}</span>
                  <span className="lv-history-title">{s.taskTitle}</span>
                  <span className="lv-history-dur">{formatDur(s.actualSeconds)}</span>
                  <span className="lv-history-time">{fmtTime(s.startTime)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
