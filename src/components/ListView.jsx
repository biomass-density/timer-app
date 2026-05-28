import { formatMinutesLabel, formatClock } from '../utils/timeUtils'

function formatDur(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ListView({ tasks, sessions, totalListMinutes, endTime, incompleteTasks }) {
  const completed = tasks.filter(t => t.completed)
  const incomplete = tasks.filter(t => !t.completed)

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
              <span className="lv-col-pct">%</span>
            </div>
            {completed.map(task => {
              const plannedSec = task.durationMinutes * 60
              const actualSec = task.actualSeconds ?? 0
              const pct = plannedSec > 0 ? Math.round((actualSec / plannedSec) * 100) : 0
              return (
                <div key={task.id} className="lv-row">
                  <span className="lv-col-name">
                    <span className="lv-emoji">{task.emoji}</span>
                    {task.title}
                  </span>
                  <span className="lv-col-set">{formatDur(plannedSec)}</span>
                  <span className="lv-col-spent">{formatDur(actualSec)}</span>
                  <span className="lv-col-pct">{pct}%</span>
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
              <span className="lv-col-pct">%</span>
            </div>
            {incomplete.map(task => {
              const plannedSec = task.durationMinutes * 60
              const actualSec = task.actualSeconds ?? 0
              const pct = plannedSec > 0 ? Math.round((actualSec / plannedSec) * 100) : 0
              return (
                <div key={task.id} className="lv-row">
                  <span className="lv-col-name">
                    <span className="lv-emoji">{task.emoji}</span>
                    {task.title}
                  </span>
                  <span className="lv-col-set">{formatDur(plannedSec)}</span>
                  <span className="lv-col-spent">{actualSec > 0 ? formatDur(actualSec) : '—'}</span>
                  <span className="lv-col-pct">{pct > 0 ? `${pct}%` : '—'}</span>
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
    </div>
  )
}
