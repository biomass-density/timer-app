import { useState, useRef } from 'react'
import TaskItem from './TaskItem'
import { formatMMSS } from '../utils/timeUtils'

export default function TaskListView({
  tasks,
  incompleteTasks,
  completedTasks,
  timerState,
  elapsed,
  activeTask,
  startTask,
  toggleTimer,
  completeTask,
  deleteTask,
  moveToTop,
  updateTask,
  reorderTasks,
  pickRandom,
}) {
  const [dragOverId, setDragOverId] = useState(null)
  const draggedId = useRef(null)
  const touchDragRef = useRef(null)

  // ── Desktop drag-and-drop ──────────────────────────────────────────────
  function onDragStart(e, taskId) {
    draggedId.current = taskId
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e, taskId) {
    e.preventDefault()
    if (taskId !== draggedId.current) setDragOverId(taskId)
  }
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

  // ── Touch drag-and-drop ────────────────────────────────────────────────
  function onTouchStart(e, taskId) {
    e.preventDefault()
    touchDragRef.current = { taskId, lastOverId: null }
  }
  function onTouchMove(e) {
    if (!touchDragRef.current) return
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const taskEl = el?.closest('[data-task-id]')
    const overId = taskEl?.dataset?.taskId ?? null
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
    <div className="task-list-view">
      {/* Active timer indicator */}
      {activeTask && (
        <div className="active-indicator">
          <div className="active-pulse" />
          <span className="active-indicator-text">
            {activeTask.emoji} {activeTask.title}
            {' — '}
            {timerState.isRunning
              ? formatMMSS(Math.max(0, activeTask.durationMinutes * 60 - elapsed))
              : 'paused'}
          </span>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="task-list-empty">
          <div className="empty-icon">🦙</div>
          <h3>Ready to focus?</h3>
          <p>Tap <strong>+</strong> to add your first task.<br />End with a number for minutes — "Morning run 30"</p>
        </div>
      )}

      {/* Incomplete tasks */}
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

      {/* Random pick */}
      {incompleteTasks.length > 1 && (
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 'var(--r-full)',
            background: 'var(--bg-2)', color: 'var(--text-2)',
            fontSize: 14, fontWeight: 500,
            margin: '4px auto 12px', width: 'fit-content',
          }}
          onClick={pickRandom}
        >
          🎲 Stuck? Pick one for me
        </button>
      )}

      {/* Completed tasks */}
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
              onStart={() => {}}
              onToggleTimer={() => {}}
              onComplete={() => {}}
              onDelete={deleteTask}
              onMoveTop={moveToTop}
              onUpdate={updateTask}
              onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}}
              onDragEnd={() => {}} onTouchStart={() => {}} onTouchMove={() => {}} onTouchEnd={() => {}}
            />
          ))}
        </>
      )}
    </div>
  )
}
