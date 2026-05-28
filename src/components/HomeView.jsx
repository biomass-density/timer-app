import { useRef, useState } from 'react'
import { TASK_COLORS } from '../utils/taskUtils'
import { formatMMSS } from '../utils/timeUtils'
import TaskItem from './TaskItem'

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
  startTask, toggleTimer, adjustTime, completeTask,
  deleteTask, moveToTop, updateTask, reorderTasks, pickRandom,
  autoEmoji, autoColor, resetTask,
}) {
  const [dragOverId, setDragOverId] = useState(null)
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

  return (
    <div className="home-view">

      {/* ── Fixed pie header ─────────────────────────────────── */}
      <div className="pie-section">
        {!activeTask ? (
          <div className="no-active-task-msg">
            <span className="no-task-icon">⏱️</span>
            <p>Tap a task to start</p>
          </div>
        ) : (
          <>
            <div className="pie-with-adj">
              <button className="pie-adj-btn" onClick={() => adjustTime(5 * 60)}>−5</button>
              <div className="pie-wrap">
                <ClockFace
                  fractionOfHour={fractionOfHour}
                  fillColor={color.bg}
                  isOvertime={isOvertime}
                />
                <button className="pie-center-btn" onClick={toggleTimer}
                  aria-label={timerState.isRunning ? 'Pause' : 'Play'}
                >
                  {timerState.isRunning
                    ? <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    : <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><polygon points="7,3 21,12 7,21"/></svg>
                  }
                </button>
              </div>
              <button className="pie-adj-btn" onClick={() => adjustTime(-5 * 60)}>+5</button>
            </div>

            <div className="pie-time-display">
              <span className={`pie-time-big${isOvertime ? ' overtime' : ''}`}>
                {isOvertime ? '+' : ''}{formatMMSS(Math.abs(remainSec))}
              </span>
            </div>
          </>
        )}

        <div className="pie-action-pills">
          <button className="pie-action-pill" onClick={autoEmoji}>😊 Emoji Me!</button>
          <button className="pie-action-pill" onClick={autoColor}>🌈 Color Me!</button>
        </div>
      </div>

      {/* ── Scrollable task list ─────────────────────────────── */}
      <div className="task-list-section">
        {tasks.length === 0 && (
          <div className="task-list-empty">
            <div className="empty-icon">🦝</div>
            <h3>Ready to focus?</h3>
            <p>Tap <strong>+</strong> to add your first task.<br />End with a number for minutes — "Morning run 30"</p>
          </div>
        )}

        {incompleteTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            isActive={task.id === timerState.activeTaskId}
            elapsed={elapsed}
            timerState={timerState}
            isDragOver={dragOverId === task.id}
            onStart={startTask}
            onToggleTimer={toggleTimer}
            onComplete={completeTask}
            onDelete={deleteTask}
            onMoveTop={moveToTop}
            onUpdate={updateTask}
            onReset={resetTask}
            {...drag}
          />
        ))}

        {incompleteTasks.length > 1 && (
          <button className="random-pick-btn" onClick={pickRandom}>
            🎲 Pick one for me
          </button>
        )}

        {completedTasks.length > 0 && (
          <>
            <div className="tasks-section-label">Completed · {completedTasks.length}</div>
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} isActive={false} elapsed={0}
                timerState={timerState} isDragOver={false}
                onStart={() => {}} onToggleTimer={() => {}} onComplete={() => {}}
                onDelete={deleteTask} onMoveTop={moveToTop} onUpdate={updateTask} onReset={() => {}}
                onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}}
                onDragEnd={() => {}} onTouchStart={() => {}} onTouchMove={() => {}} onTouchEnd={() => {}}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
