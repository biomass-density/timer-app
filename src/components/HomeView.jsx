import { useState, useRef } from 'react'
import { TASK_COLORS } from '../utils/taskUtils'
import { formatMMSS } from '../utils/timeUtils'
import TaskItem from './TaskItem'
import EmojiColorPicker from './EmojiColorPicker'

const CX = 130, CY = 130, R = 110, TICK_OUTER = 118, TICK_MED = 112, TICK_INNER = 108

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

function minuteMarkers() {
  return Array.from({ length: 60 }, (_, i) => {
    const is5 = i % 5 === 0
    const p1 = polar(i * 6, TICK_OUTER)
    const p2 = polar(i * 6, is5 ? TICK_INNER : TICK_MED)
    return (
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={is5 ? '#C8C8D8' : '#E0E0EC'}
        strokeWidth={is5 ? 2 : 1} strokeLinecap="round"
      />
    )
  })
}

export default function HomeView({
  tasks, incompleteTasks, completedTasks,
  timerState, elapsed, activeTask,
  startTask, toggleTimer, adjustTime, completeTask,
  deleteTask, moveToTop, updateTask, reorderTasks, pickRandom,
  autoEmoji, autoColor,
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [dragOverId, setDragOverId] = useState(null)
  const draggedId = useRef(null)
  const touchDragRef = useRef(null)

  const plannedSec = activeTask ? activeTask.durationMinutes * 60 : 0
  const remainSec = activeTask ? plannedSec - elapsed : 0
  const isOvertime = remainSec < 0
  const fractionOfHour = activeTask ? Math.max(0, Math.min(remainSec, 3600)) / 3600 : 0
  const color = activeTask ? (TASK_COLORS[activeTask.color] ?? TASK_COLORS.purple) : TASK_COLORS.purple

  function onDragStart(e, taskId) { draggedId.current = taskId; e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e, taskId) { e.preventDefault(); if (taskId !== draggedId.current) setDragOverId(taskId) }
  function onDrop(taskId) {
    const fromId = draggedId.current
    if (!fromId || fromId === taskId) { cleanup(); return }
    const list = [...incompleteTasks]
    const fi = list.findIndex(t => t.id === fromId)
    const ti = list.findIndex(t => t.id === taskId)
    if (fi >= 0 && ti >= 0) {
      const [item] = list.splice(fi, 1)
      list.splice(ti, 0, item)
      reorderTasks([...list, ...completedTasks])
    }
    cleanup()
  }
  function onDragEnd() { cleanup() }
  function cleanup() { draggedId.current = null; setDragOverId(null) }
  function onTouchStart(e, taskId) { e.preventDefault(); touchDragRef.current = { taskId, lastOverId: null } }
  function onTouchMove(e) {
    if (!touchDragRef.current) return
    const touch = e.changedTouches[0]
    const overId = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-task-id]')?.dataset?.taskId ?? null
    if (overId && overId !== touchDragRef.current.taskId) {
      touchDragRef.current.lastOverId = overId
      setDragOverId(overId)
    }
  }
  function onTouchEnd() {
    if (!touchDragRef.current) return
    const { taskId, lastOverId } = touchDragRef.current
    if (lastOverId && lastOverId !== taskId) {
      const list = [...incompleteTasks]
      const fi = list.findIndex(t => t.id === taskId)
      const ti = list.findIndex(t => t.id === lastOverId)
      if (fi >= 0 && ti >= 0) {
        const [item] = list.splice(fi, 1)
        list.splice(ti, 0, item)
        reorderTasks([...list, ...completedTasks])
      }
    }
    touchDragRef.current = null
    setDragOverId(null)
  }
  const dragHandlers = { onDragStart, onDragOver, onDrop, onDragEnd, onTouchStart, onTouchMove, onTouchEnd }

  return (
    <div className="home-view">
      {/* ── Sticky pie section ── */}
      <div className="pie-section">
        {!activeTask ? (
          <div className="no-active-task-msg">
            <div className="no-task-icon">⏱️</div>
            <p>Tap a task to start</p>
          </div>
        ) : (
          <>
            <div className="pie-wrap">
              <svg className="pie-svg" viewBox="0 0 260 260">
                <circle cx={CX} cy={CY} r={R} fill="#F5F6FA" />
                {minuteMarkers()}
                {fractionOfHour > 0 && (
                  <path
                    d={pieSlicePath(fractionOfHour)}
                    fill={isOvertime ? '#FF4757' : color.bg}
                    opacity={isOvertime ? 0.85 : 0.9}
                  />
                )}
                <circle cx={CX} cy={CY} r={42} fill="white" />
              </svg>
              <button className="pie-center-btn" onClick={toggleTimer} aria-label={timerState.isRunning ? 'Pause' : 'Play'}>
                {timerState.isRunning
                  ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="6,3 21,12 6,21"/></svg>
                }
              </button>
            </div>

            <div className="pie-time-display">
              <div className={`pie-time-big${isOvertime ? ' overtime' : ''}`}>
                {isOvertime ? '+' : ''}{formatMMSS(Math.abs(remainSec))}
              </div>
            </div>

            <div className="pie-adjust-row">
              <button className="pie-adj-btn" onClick={() => adjustTime(5 * 60)}>−5</button>
              <button className="pie-adj-btn" onClick={() => adjustTime(-5 * 60)}>+5</button>
            </div>
          </>
        )}

        {/* Action pills — always visible */}
        <div className="pie-action-pills">
          <button className="pie-action-pill" onClick={autoEmoji}>
            😊 Emoji Me!
          </button>
          <button className="pie-action-pill" onClick={autoColor}>
            🌈 Color Me!
          </button>
          {activeTask && (
            <button
              className="pie-action-pill complete-pill"
              onClick={() => completeTask(activeTask.id)}
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable task list ── */}
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
            {...dragHandlers}
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
              <TaskItem
                key={task.id}
                task={task}
                isActive={false}
                elapsed={0}
                timerState={timerState}
                isDragOver={false}
                onStart={() => {}} onToggleTimer={() => {}} onComplete={() => {}}
                onDelete={deleteTask} onMoveTop={moveToTop} onUpdate={updateTask}
                onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}}
                onDragEnd={() => {}} onTouchStart={() => {}} onTouchMove={() => {}} onTouchEnd={() => {}}
              />
            ))}
          </>
        )}
      </div>

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
