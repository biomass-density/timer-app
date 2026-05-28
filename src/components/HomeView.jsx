import { useRef, useState } from 'react'
import { TASK_COLORS, EMOJI_THEMES, COLOR_THEMES } from '../utils/taskUtils'
import { formatMMSS } from '../utils/timeUtils'
import TaskItem from './TaskItem'

// ── Schedule helpers ──────────────────────────────────────────────────────────
function fmtClock(ms) {
  const d = new Date(ms)
  const h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function computeSchedule(incompleteTasks, activeTaskId, elapsed) {
  const nowMs = Date.now()
  const times = []
  let cursor = nowMs
  for (const task of incompleteTasks) {
    const durMs = task.durationMinutes * 60 * 1000
    if (task.id === activeTaskId) {
      const start = nowMs - elapsed * 1000
      const end = start + durMs
      times.push({ start, end })
      cursor = Math.max(nowMs, end)
    } else {
      times.push({ start: cursor, end: cursor + durMs })
      cursor += durMs
    }
  }
  return times
}

// ── SVG constants — slightly larger viewBox so clock numbers fit ──────────
const CX = 140, CY = 140, R = 110
const TICK_OUTER = 118, TICK_MED = 112, TICK_INNER = 107

function polar(angleDeg, r = R) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function pieSlicePath(fractionOfHour) {
  const deg = fractionOfHour * 360
  if (deg <= 0.5) return ''
  if (deg >= 359.5) return `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`
  const end = polar(deg)
  const large = deg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y} Z`
}

function ClockFace({ fractionOfHour, fillColor, isOvertime }) {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const is5 = i % 5 === 0
    const p1 = polar(i * 6, TICK_OUTER)
    const p2 = polar(i * 6, is5 ? TICK_INNER : TICK_MED)
    return (
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={is5 ? '#C0C0D0' : '#E0E0EC'}
        strokeWidth={is5 ? 1.5 : 1} strokeLinecap="round"
      />
    )
  })

  const numbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((n, i) => {
    const pos = polar(i * 30, 128)
    return (
      <text key={n} x={pos.x} y={pos.y}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill="#ADADC0" fontFamily="system-ui,sans-serif" fontWeight="500"
      >{n}</text>
    )
  })

  return (
    <svg className="pie-svg" viewBox="0 0 280 280">
      <circle cx={CX} cy={CY} r={R} fill="#F5F6FA" />
      {ticks}
      {numbers}
      {fractionOfHour > 0 && (
        <path
          d={pieSlicePath(fractionOfHour)}
          fill={isOvertime ? '#FF4757' : fillColor}
          opacity={isOvertime ? 0.85 : 0.9}
        />
      )}
      <circle cx={CX} cy={CY} r={40} fill="white" />
    </svg>
  )
}

export default function HomeView({
  tasks, incompleteTasks, completedTasks,
  timerState, elapsed, activeTask,
  selectTask, toggleTimer, adjustTime, completeTask,
  deleteTask, moveToTop, updateTask, reorderTasks,
  onEmojiTheme, onColorTheme, resetTask, clearCompleted,
  showQuickAdd, quickInput, setQuickInput, onSubmitQuickAdd, onCancelQuickAdd, quickInputRef,
}) {
  const [dragOverId, setDragOverId] = useState(null)
  const [showEmojiSheet, setShowEmojiSheet] = useState(false)
  const [showColorSheet, setShowColorSheet] = useState(false)
  const draggedId = useRef(null)
  const touchDragRef = useRef(null)

  const plannedSec = activeTask ? activeTask.durationMinutes * 60 : 0
  const remainSec = activeTask ? plannedSec - elapsed : 0
  const isOvertime = remainSec < 0
  const fractionOfHour = activeTask ? Math.max(0, Math.min(remainSec, 3600)) / 3600 : 0
  const color = activeTask ? (TASK_COLORS[activeTask.color] ?? TASK_COLORS.purple) : TASK_COLORS.purple

  // Drag handlers
  function onDragStart(e, id) { draggedId.current = id; e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e, id) { e.preventDefault(); if (id !== draggedId.current) setDragOverId(id) }
  function onDrop(id) {
    const from = draggedId.current
    if (!from || from === id) { cleanup(); return }
    const list = [...incompleteTasks]
    const fi = list.findIndex(t => t.id === from)
    const ti = list.findIndex(t => t.id === id)
    if (fi >= 0 && ti >= 0) { const [item] = list.splice(fi, 1); list.splice(ti, 0, item); reorderTasks([...list, ...completedTasks]) }
    cleanup()
  }
  function onDragEnd() { cleanup() }
  function cleanup() { draggedId.current = null; setDragOverId(null) }
  function onTouchStart(e, id) { e.preventDefault(); touchDragRef.current = { taskId: id, lastOverId: null } }
  function onTouchMove(e) {
    if (!touchDragRef.current) return
    const t = e.changedTouches[0]
    const overId = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-task-id]')?.dataset?.taskId ?? null
    if (overId && overId !== touchDragRef.current.taskId) { touchDragRef.current.lastOverId = overId; setDragOverId(overId) }
  }
  function onTouchEnd() {
    if (!touchDragRef.current) return
    const { taskId, lastOverId } = touchDragRef.current
    if (lastOverId && lastOverId !== taskId) {
      const list = [...incompleteTasks]
      const fi = list.findIndex(t => t.id === taskId)
      const ti = list.findIndex(t => t.id === lastOverId)
      if (fi >= 0 && ti >= 0) { const [item] = list.splice(fi, 1); list.splice(ti, 0, item); reorderTasks([...list, ...completedTasks]) }
    }
    touchDragRef.current = null; setDragOverId(null)
  }
  const drag = { onDragStart, onDragOver, onDrop, onDragEnd, onTouchStart, onTouchMove, onTouchEnd }

  const schedule = computeSchedule(incompleteTasks, timerState.activeTaskId, elapsed)

  return (
    <div className="home-view">

      {/* ── Pie header — always visible ───────────────────────── */}
      <div className="pie-section">

        {/* Clock is always shown; slice appears when a task is active */}
        <div className="pie-wrap">
          <ClockFace
            fractionOfHour={fractionOfHour}
            fillColor={color.bg}
            isOvertime={isOvertime}
          />
          <button
            className="pie-center-btn"
            onClick={toggleTimer}
            aria-label={timerState.isRunning ? 'Pause' : 'Play'}
          >
            {timerState.isRunning
              ? <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><polygon points="7,3 21,12 7,21"/></svg>
            }
          </button>
        </div>

        {/* Digital time with −5 / +5 flanking it */}
        <div className="pie-time-row">
          <button className="pie-adj-btn" onClick={() => adjustTime(5 * 60)} disabled={!activeTask}>−5</button>
          <span className={`pie-time-big${isOvertime ? ' overtime' : ''}`}>
            {activeTask
              ? (isOvertime ? '+' : '') + formatMMSS(Math.abs(remainSec))
              : '00:00'
            }
          </span>
          <button className="pie-adj-btn" onClick={() => adjustTime(-5 * 60)} disabled={!activeTask}>+5</button>
        </div>

        <div className="pie-action-pills">
          <button className="pie-action-pill" onClick={() => setShowEmojiSheet(true)}>😊 Emoji Me!</button>
          <button className="pie-action-pill" onClick={() => setShowColorSheet(true)}>🌈 Color Me!</button>
        </div>
      </div>

      {/* ── Scrollable task list ─────────────────────────────── */}
      <div className="task-list-section">

        {/* Inline quick-add bar — appears at top when FAB is pressed */}
        {showQuickAdd && (
          <form className="quick-add-inline" onSubmit={onSubmitQuickAdd}>
            <input
              ref={quickInputRef}
              className="quick-add-inline-input"
              placeholder='Enter task name and duration'
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="done"
            />
            <button type="submit" className="quick-add-inline-submit">Add</button>
            <button type="button" className="quick-add-inline-cancel" onClick={onCancelQuickAdd} aria-label="Cancel">×</button>
          </form>
        )}

        {tasks.length === 0 && !showQuickAdd && (
          <div className="task-list-empty">
            <div className="empty-icon">🦝</div>
            <h3>Ready to focus?</h3>
            <p>Tap <strong>+</strong> to add your first task.<br />End with a number for minutes — "Morning run 30"</p>
          </div>
        )}

        {incompleteTasks.map((task, idx) => {
          const t = schedule[idx]
          return (
            <div key={task.id}>
              {t && (
                <div className="task-time-badge">
                  {fmtClock(t.start)} → {fmtClock(t.end)}
                </div>
              )}
              <TaskItem
                task={task}
                isActive={task.id === timerState.activeTaskId}
                elapsed={elapsed}
                timerState={timerState}
                isDragOver={dragOverId === task.id}
                onSelect={selectTask}
                onToggleTimer={toggleTimer}
                onComplete={completeTask}
                onDelete={deleteTask}
                onMoveTop={moveToTop}
                onUpdate={updateTask}
                onReset={resetTask}
                {...drag}
              />
            </div>
          )
        })}

        {completedTasks.length > 0 && (
          <>
            <div className="tasks-section-label">
              <span>Completed · {completedTasks.length}</span>
              <button className="clear-completed-btn" onClick={clearCompleted}>Clear</button>
            </div>
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} isActive={false} elapsed={0}
                timerState={timerState} isDragOver={false}
                onSelect={() => {}} onToggleTimer={() => {}} onComplete={() => {}}
                onDelete={deleteTask} onMoveTop={moveToTop} onUpdate={updateTask} onReset={() => {}}
                onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}}
                onDragEnd={() => {}} onTouchStart={() => {}} onTouchMove={() => {}} onTouchEnd={() => {}}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Emoji theme sheet ─────────────────────────────────── */}
      {showEmojiSheet && (
        <div className="modal-overlay" onClick={() => setShowEmojiSheet(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Emoji Theme</div>
            <div className="theme-list">
              {EMOJI_THEMES.map(theme => (
                <button key={theme.id} className="theme-list-item" onClick={() => {
                  onEmojiTheme(theme.id)
                  setShowEmojiSheet(false)
                }}>
                  <span className="theme-item-preview">{theme.preview}</span>
                  <span className="theme-item-name">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Color theme sheet ─────────────────────────────────── */}
      {showColorSheet && (
        <div className="modal-overlay" onClick={() => setShowColorSheet(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Color Theme</div>
            <div className="theme-list">
              {COLOR_THEMES.map(theme => (
                <button key={theme.id} className="theme-list-item" onClick={() => {
                  onColorTheme(theme.id)
                  setShowColorSheet(false)
                }}>
                  <span className="theme-color-dots">
                    {theme.colors
                      ? theme.colors.slice(0, 5).map((c, i) => (
                          <span key={i} className="theme-color-dot" style={{ background: TASK_COLORS[c]?.bg }} />
                        ))
                      : <span className="theme-color-dot theme-color-dot--star">✨</span>
                    }
                  </span>
                  <span className="theme-item-name">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
