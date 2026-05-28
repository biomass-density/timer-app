import { useState } from 'react'
import { TASK_COLORS } from '../utils/taskUtils'
import { formatMMSS, formatDuration } from '../utils/timeUtils'
import EmojiColorPicker from './EmojiColorPicker'

export default function TaskItem({
  task, isActive, elapsed, timerState, isDragOver,
  onSelect, onToggleTimer, onComplete, onDelete, onMoveTop, onUpdate, onReset,
  onDragStart, onDragOver, onDrop, onDragEnd, onTouchStart, onTouchMove, onTouchEnd,
}) {
  const [showPicker, setShowPicker] = useState(false)

  const color = TASK_COLORS[task.color] ?? TASK_COLORS.purple
  const plannedSec = task.durationMinutes * 60
  const displaySec = isActive ? plannedSec - elapsed : plannedSec
  const isOvertime = isActive && displaySec < 0
  const timeLabel = isActive ? formatMMSS(Math.abs(displaySec)) : formatDuration(plannedSec)
  const elapsedLabel = isActive
    ? formatDuration(Math.max(0, elapsed))
    : (task.actualSeconds ? formatDuration(task.actualSeconds) : '0:00')

  function handleCardTap() {
    if (task.completed) return
    if (isActive) onToggleTimer()   // tap active card to pause/resume
    else onSelect(task.id)          // tap other card to preload it
  }

  // CSS custom properties drive all colors inside the card
  const cardStyle = {
    background: color.bg,
    '--task-text':    color.text,
    '--task-text2':   color.text2,
    '--task-btn-bg':  color.btnBg,
  }

  return (
    <>
      <div
        className={`task-item${isActive ? ' active-task' : ''}${task.completed ? ' completed-task' : ''}${isDragOver ? ' drag-over' : ''}`}
        style={cardStyle}
        data-task-id={task.id}
        draggable={!task.completed}
        onDragStart={e => onDragStart(e, task.id)}
        onDragOver={e => onDragOver(e, task.id)}
        onDrop={() => onDrop(task.id)}
        onDragEnd={onDragEnd}
      >
        {/* ── Main row ── */}
        <div className="task-main-row" onClick={handleCardTap}>
          <div
            className="task-emoji-tile"
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
            <span
              className="task-drag-handle"
              onTouchStart={e => onTouchStart(e, task.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onClick={e => e.stopPropagation()}
            >⠿</span>
          )}
        </div>

        {/* ── Action row — always visible for incomplete tasks ── */}
        {!task.completed && (
          <div className="task-action-row">
            <span className={`task-action-time${isOvertime ? ' overtime' : ''}`}>
              {isOvertime ? '+' : ''}{timeLabel}
            </span>
            <button
              className="task-action-btn danger"
              onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            >Delete</button>
            <button
              className="task-action-btn"
              onClick={e => { e.stopPropagation(); onReset(task.id) }}
            >Reset</button>
            <button
              className="task-action-btn"
              onClick={e => { e.stopPropagation(); onMoveTop(task.id) }}
            >Top</button>
            <button
              className="task-action-btn accent"
              onClick={e => { e.stopPropagation(); onComplete(task.id) }}
            >Complete</button>
            <span className="task-action-elapsed">{elapsedLabel}</span>
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
