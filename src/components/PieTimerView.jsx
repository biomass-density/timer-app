import { useState } from 'react'
import { TASK_COLORS } from '../utils/taskUtils'
import { formatMMSS, formatDuration } from '../utils/timeUtils'
import EmojiColorPicker from './EmojiColorPicker'

// ── SVG Pie math ──────────────────────────────────────────────────────────
const CX = 130, CY = 130, R = 110, TICK_OUTER = 118, TICK_MED = 112, TICK_INNER = 108

function polar(angleDeg, r = R) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function pieSlicePath(fractionOfHour) {
  const deg = fractionOfHour * 360
  if (deg <= 0.5) return ''
  if (deg >= 359.5) {
    // Full circle: draw as two arcs
    return `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`
  }
  const end = polar(deg)
  const large = deg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y} Z`
}

function minuteMarkers() {
  return Array.from({ length: 60 }, (_, i) => {
    const is5 = i % 5 === 0
    const outer = TICK_OUTER
    const inner = is5 ? TICK_INNER : TICK_MED
    const p1 = polar(i * 6, outer)
    const p2 = polar(i * 6, inner)
    return (
      <line
        key={i}
        x1={p1.x} y1={p1.y}
        x2={p2.x} y2={p2.y}
        stroke={is5 ? '#C8C8D8' : '#E0E0EC'}
        strokeWidth={is5 ? 2 : 1}
        strokeLinecap="round"
      />
    )
  })
}

export default function PieTimerView({
  tasks,
  incompleteTasks,
  timerState,
  elapsed,
  activeTask,
  startTask,
  toggleTimer,
  adjustTime,
  completeTask,
  updateTask,
  timerMode,
  setTimerMode,
}) {
  const [showPicker, setShowPicker] = useState(false)

  const plannedSec = activeTask ? activeTask.durationMinutes * 60 : 0
  const remainSec = activeTask ? plannedSec - elapsed : 0
  const isOvertime = remainSec < 0

  // Fraction of 60-min dial to show as slice
  const fractionOfHour = activeTask
    ? Math.max(0, Math.min(remainSec, 3600)) / 3600
    : 0

  const color = activeTask ? (TASK_COLORS[activeTask.color] ?? TASK_COLORS.purple) : TASK_COLORS.purple
  const upcomingTasks = incompleteTasks.filter(t => t.id !== timerState.activeTaskId).slice(0, 5)

  return (
    <div className="pie-timer-view">
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

      {!activeTask ? (
        <div className="no-active-task-msg">
          <div className="no-task-icon">⏱️</div>
          <h3>No active task</h3>
          <p>Go to the List tab and tap a task to start the timer.</p>
        </div>
      ) : (
        <>
          {/* Pie dial */}
          <div className="pie-wrap">
            <svg className="pie-svg" viewBox="0 0 260 260">
              {/* Dial ring */}
              <circle cx={CX} cy={CY} r={R} fill="#F5F6FA" />
              {/* Minute markers */}
              {minuteMarkers()}
              {/* Pie slice */}
              {fractionOfHour > 0 && (
                <path
                  d={pieSlicePath(fractionOfHour)}
                  fill={isOvertime ? '#FF4757' : color.bg}
                  opacity={isOvertime ? 0.85 : 0.9}
                />
              )}
              {/* Center circle */}
              <circle cx={CX} cy={CY} r={42} fill="white" />
            </svg>

            {/* Play/pause button in center */}
            <button
              className="pie-center-btn"
              onClick={toggleTimer}
              aria-label={timerState.isRunning ? 'Pause' : 'Play'}
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
          </div>

          {/* Time display */}
          <div className="pie-time-display">
            <div className={`pie-time-big${isOvertime ? ' overtime' : ''}`}>
              {isOvertime ? '+' : ''}{formatMMSS(Math.abs(remainSec))}
            </div>
            <div className="pie-task-name">{activeTask.emoji} {activeTask.title}</div>
          </div>

          {/* −5 / +5 adjust row */}
          <div className="pie-adjust-row">
            <button className="pie-adj-btn" onClick={() => adjustTime(5 * 60)}>−5</button>
            <span style={{ color: 'var(--text-3)', fontSize: 13 }}>minutes</span>
            <button className="pie-adj-btn" onClick={() => adjustTime(-5 * 60)}>+5</button>
          </div>

          {/* Action pills */}
          <div className="pie-action-pills">
            <button className="pie-action-pill" onClick={() => setShowPicker(true)}>
              {activeTask.emoji} Emoji / Color
            </button>
            <button
              className="pie-action-pill"
              style={{ background: 'var(--accent)', color: 'white', fontWeight: 600 }}
              onClick={() => completeTask(activeTask.id)}
            >
              ✓ Complete
            </button>
          </div>
        </>
      )}

      {/* Upcoming tasks */}
      {upcomingTasks.length > 0 && (
        <div className="pie-upcoming">
          <div className="upcoming-label">Up next</div>
          {upcomingTasks.map(task => (
            <div
              key={task.id}
              className="upcoming-task-row"
              onClick={() => startTask(task.id)}
            >
              <span className="upcoming-emoji">{task.emoji}</span>
              <span className="upcoming-title">{task.title}</span>
              <span className="upcoming-dur">{formatDuration(task.durationMinutes * 60)}</span>
            </div>
          ))}
        </div>
      )}

      {showPicker && activeTask && (
        <EmojiColorPicker
          task={activeTask}
          onUpdate={updates => updateTask(activeTask.id, updates)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
