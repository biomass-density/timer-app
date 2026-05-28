import { useState } from 'react'
import { TASK_COLORS } from '../utils/taskUtils'
import { formatMMSS, formatDuration } from '../utils/timeUtils'
import EmojiColorPicker from './EmojiColorPicker'

export default function TaskItem({
  task,
  isActive,
  elapsed,
  timerState,
  isDragOver,
  onStart,
  onToggleTimer,
  onComplete,
  onDelete,
  onMoveTop,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const color = TASK_COLORS[task.color] ?? TASK_COLORS.purple
  const plannedSec = task.durationMinutes * 60
  const displaySec = isActive ? plannedSec - elapsed : plannedSec
  const isOvertime = isActive && displaySec < 0
  const timeLabel = isActive ? formatMMSS(Math.abs(displaySec)) : formatDuration(plannedSec)
  const elapsedLabel = isActive ? formatDuration(elapsed) : formatDuration(task.actualSeconds ?? 0)

  function handleRowClick() {
    if (!task.completed) setExpanded(e => !e)
  }

  return (
    <>
      <div
        className={`task-item${isActive ? ' active-task' : ''}${task.completed ? ' completed-task' : ''}${isDragOver ? ' drag-over' : ''}`}
        data-task-id={task.id}
        draggable={!task.completed}
        onDragStart={e => onDragStart(e, task.id)}
        onDragOver={e => onDragOver(e, task.id)}
        onDrop={() => onDrop(task.id)}
        onDragEnd={onDragEnd}
      >
        {/* Main row */}
        <div className="task-main-row" onClick={handleRowClick}>
          <div className="task-color-bar" style={{ background: color.bg }} />

          <div
            className="task-emoji-tile"
            style={{ background: `${color.bg}22` }}
            onClick={e => { e.stopPropagation(); if (!task.completed) setShowPicker(true) }}
          >
            {task.emoji}
          </div>

          <div className="task-title-wrap">
            <div className={`task-title${task.completed ? ' done-title' : ''}`}>
              {task.title}
            </div>
          </div>

          {!task.completed && (
            <span className={`task-duration-badge${isOvertime ? ' overtime' : ''}`}>
              {isOvertime ? '+' : ''}{timeLabel}
            </span>
          )}

          {isActive && !task.completed && (
            <button
              className={`task-play-btn${!timerState.isRunning ? ' paused-btn' : ''}`}
              onClick={e => { e.stopPropagation(); onToggleTimer() }}
              aria-label={timerState.isRunning ? 'Pause' : 'Resume'}
            >
              {timerState.isRunning
                ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
          )}

          {!task.completed && (
            <svg className={`task-chevron${expanded ? ' open' : ''}`}
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          )}

          {!task.completed && (
            <span
              className="task-drag-handle"
              onTouchStart={e => onTouchStart(e, task.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onClick={e => e.stopPropagation()}
              aria-label="Drag to reorder"
            >⠿</span>
          )}
        </div>

        {/* Expanded action row */}
        {expanded && !task.completed && (
          <div className="task-expanded-row">
            <span className={`task-time-pill${isOvertime ? ' overtime' : ''}`}>
              {isOvertime ? '+' : ''}{timeLabel}
            </span>
            <div className="task-action-group">
              <button className="task-action-btn danger" onClick={() => onDelete(task.id)}>
                Delete
              </button>
              <span className="task-action-sep" />
              <button className="task-action-btn" onClick={() => { onMoveTop(task.id); setExpanded(false) }}>
                Top
              </button>
              <span className="task-action-sep" />
              {!isActive
                ? <button className="task-action-btn accent" onClick={() => { onStart(task.id); setExpanded(false) }}>
                    Start
                  </button>
                : <button className="task-action-btn accent" onClick={() => { onComplete(task.id); setExpanded(false) }}>
                    Complete
                  </button>
              }
            </div>
            <span className="task-elapsed-label">{elapsedLabel}</span>
          </div>
        )}
      </div>

      {showPicker && (
        <EmojiColorPicker
          task={task}
          onUpdate={updates => onUpdate(task.id, updates)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
