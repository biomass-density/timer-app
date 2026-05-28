import { formatMMSS, formatClock } from '../utils/timeUtils'

export default function DigitalTimerView({
  activeTask,
  timerState,
  elapsed,
  sessions,
  toggleTimer,
  adjustTime,
  completeTask,
  startTask,
  incompleteTasks,
  timerMode,
  setTimerMode,
}) {
  const plannedSec = activeTask ? activeTask.durationMinutes * 60 : 0
  const remainSec = activeTask ? plannedSec - elapsed : 0
  const isOvertime = remainSec < 0

  // Today's sessions only
  const todaySessions = sessions.slice(-10).reverse()

  return (
    <div className="digital-timer-view">
      {/* Mode toggle */}
      <div className="timer-mode-toggle">
        <button
          className={`timer-mode-btn${timerMode === 'pie' ? ' active' : ''}`}
          onClick={() => setTimerMode('pie')}
        >🥧 Pie</button>
        <button
          className={`timer-mode-btn${timerMode === 'digital' ? ' active' : ''}`}
          onClick={() => setTimerMode('digital')}
        >🔢 Digital</button>
      </div>

      {/* Time display card */}
      <div className="digital-time-display" style={{ width: '100%' }}>
        <div className={`digital-time-big${isOvertime ? ' overtime' : ''}`}>
          {isOvertime ? '+' : ''}{formatMMSS(Math.abs(remainSec))}
        </div>
        <div className="digital-label">
          {activeTask ? 'Focused work' : 'No task selected'}
        </div>
        {activeTask && (
          <div className="digital-task-name">
            {activeTask.emoji} {activeTask.title}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="digital-controls">
        <button className="digital-ctrl-btn" onClick={() => adjustTime(5 * 60)}>−5m</button>
        <button
          className="digital-play-btn"
          onClick={toggleTimer}
          disabled={!activeTask}
          style={{ opacity: activeTask ? 1 : 0.4 }}
        >
          {timerState.isRunning
            ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            : <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <polygon points="6,3 21,12 6,21"/>
              </svg>
          }
        </button>
        <button className="digital-ctrl-btn" onClick={() => adjustTime(-5 * 60)}>+5m</button>
      </div>

      {activeTask && (
        <button
          style={{
            background: 'var(--accent)', color: 'white', borderRadius: 'var(--r-full)',
            padding: '12px 32px', fontSize: 15, fontWeight: 600,
            marginBottom: 20, transition: 'transform 0.12s',
          }}
          onClick={() => completeTask(activeTask.id)}
        >
          ✓ Complete task
        </button>
      )}

      {/* Upcoming tasks */}
      {incompleteTasks.filter(t => t.id !== timerState.activeTaskId).length > 0 && (
        <div className="sessions-section" style={{ marginBottom: 20 }}>
          <div className="sessions-label">Upcoming</div>
          {incompleteTasks.filter(t => t.id !== timerState.activeTaskId).slice(0, 4).map(task => (
            <div
              key={task.id}
              className="session-block"
              style={{ cursor: 'pointer' }}
              onClick={() => startTask(task.id)}
            >
              <span className="session-emoji">{task.emoji}</span>
              <div className="session-info">
                <div className="session-title">{task.title}</div>
                <div className="session-times">{task.durationMinutes} min planned</div>
              </div>
              <span className="session-dur">{formatMMSS(task.durationMinutes * 60)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Session history */}
      {todaySessions.length > 0 && (
        <div className="sessions-section">
          <div className="sessions-label">Session history</div>
          {todaySessions.map(s => {
            const start = new Date(s.startTime)
            const end = new Date(s.endTime)
            const actualMin = Math.round(s.actualSeconds / 60)
            return (
              <div key={s.id} className="session-block">
                <span className="session-emoji">{s.taskEmoji}</span>
                <div className="session-info">
                  <div className="session-title">{s.taskTitle}</div>
                  <div className="session-times">
                    {formatClock(start)} → {formatClock(end)}
                  </div>
                </div>
                <span className="session-dur">{actualMin}m</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
