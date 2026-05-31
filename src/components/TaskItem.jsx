import { useState, useRef } from 'react'
import { TASK_COLORS } from '../utils/taskUtils'
import { formatMMSS, formatDuration } from '../utils/timeUtils'
import { haptic } from '../utils/haptic'
import EmojiColorPicker from './EmojiColorPicker'

function fmtT(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const h = d.getHours(), m = d.getMinutes()
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`
}

export default function TaskItem({
  task, isActive, elapsed, timerState, isDragOver,
  schedStart, schedEnd,
  onSelect, onToggleTimer, onComplete, onDelete, onMoveTop, onUpdate, onReset,
  onDragStart, onDragOver, onDrop, onDragEnd, onTouchStart, onTouchMove, onTouchEnd,
}) {
  const [showPicker, setShowPicker]     = useState(false)
  const [editing, setEditing]           = useState(false)
  const [editTitle, setEditTitle]       = useState(task.title)
  const [editMins, setEditMins]         = useState(String(task.durationMinutes))
  const [showElapsed, setShowElapsed]   = useState(true)   // elapsed label toggle
  const [swipeX, setSwipeX]             = useState(0)
  const swipeTouchRef                   = useRef(null)
  const longPressTimer                  = useRef(null)
  const editTitleRef                    = useRef(null)

  // Clear the long-press timer if the card unmounts mid-press (e.g. task deleted by swipe)
  useEffect(() => () => clearTimeout(longPressTimer.current), [])

  const color = TASK_COLORS[task.color] ?? TASK_COLORS.purple
  const plannedSec  = task.durationMinutes * 60
  const displaySec  = isActive ? plannedSec - elapsed : plannedSec
  const isOvertime  = isActive && displaySec < 0
  const timeLabel   = isActive ? formatMMSS(Math.abs(displaySec)) : formatDuration(plannedSec)
  const elapsedLabel = isActive
    ? formatDuration(Math.max(0, elapsed))
    : (task.actualSeconds ? formatDuration(task.actualSeconds) : '0:00')

  // ── Card tap ──────────────────────────────────────────────────────────────
  function handleCardTap() {
    if (editing || task.completed) return
    if (isActive) onToggleTimer()
    else onSelect(task.id)
  }

  // ── Long press on title → edit mode ──────────────────────────────────────
  function onTitleTouchStart(e) {
    if (task.completed || editing) return
    longPressTimer.current = setTimeout(() => {
      haptic(20)
      setEditTitle(task.title)
      setEditMins(String(task.durationMinutes))
      setEditing(true)
      setTimeout(() => editTitleRef.current?.focus(), 50)
    }, 600)
  }
  function onTitleTouchEnd()  { clearTimeout(longPressTimer.current) }
  function onTitleTouchMove() { clearTimeout(longPressTimer.current) }

  // ── Inline edit save / cancel ─────────────────────────────────────────────
  function handleSaveEdit(e) {
    e?.preventDefault()
    const newTitle = editTitle.trim()
    const newMins  = Math.max(1, Math.min(480, parseInt(editMins, 10) || task.durationMinutes))
    if (newTitle) onUpdate(task.id, { title: newTitle, durationMinutes: newMins })
    haptic(10)
    setEditing(false)
  }
  function handleCancelEdit() { setEditing(false) }

  // ── Swipe gesture ─────────────────────────────────────────────────────────
  const SWIPE_COMPLETE = 80   // px to trigger complete
  const SWIPE_DELETE   = 110  // px to trigger delete

  function onCardTouchStart(e) {
    if (task.completed || editing) return
    if (e.target.closest('.task-drag-handle') || e.target.closest('.task-emoji-tile') || e.target.closest('button')) return
    swipeTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY }
  }
  function onCardTouchMove(e) {
    if (!swipeTouchRef.current) return
    const dx = e.touches[0].clientX - swipeTouchRef.current.startX
    const dy = e.touches[0].clientY - swipeTouchRef.current.startY
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 12) {
      setSwipeX(Math.max(-SWIPE_DELETE - 30, Math.min(SWIPE_COMPLETE + 30, dx)))
    }
  }
  function onCardTouchEnd() {
    if (!swipeTouchRef.current) { setSwipeX(0); return }
    if (swipeX >= SWIPE_COMPLETE) {
      haptic(50)
      onComplete(task.id)
    } else if (swipeX <= -SWIPE_DELETE) {
      haptic([30, 10, 30])
      onDelete(task.id)
    }
    setSwipeX(0)
    swipeTouchRef.current = null
  }

  const swipeDir = swipeX >= 40 ? 'complete' : swipeX <= -50 ? 'delete' : null

  // CSS custom properties
  const cardStyle = {
    background: color.bg,
    '--task-text':   color.text,
    '--task-text2':  color.text2,
    '--task-btn-bg': color.btnBg,
  }

  const inner = (
    <div
      className={`task-item${isActive ? ' active-task' : ''}${task.completed ? ' completed-task' : ''}${isDragOver ? ' drag-over' : ''} task-swipe-inner`}
      style={{
        ...cardStyle,
        transform: `translateX(${swipeX * 0.6}px)`,
        transition: swipeTouchRef.current ? 'none' : 'transform 0.25s cubic-bezier(.32,1,.28,1)',
      }}
      data-task-id={task.id}
      draggable={!task.completed}
      onDragStart={e => onDragStart(e, task.id)}
      onDragOver={e => onDragOver(e, task.id)}
      onDrop={() => onDrop(task.id)}
      onDragEnd={onDragEnd}
      onTouchStart={onCardTouchStart}
      onTouchMove={onCardTouchMove}
      onTouchEnd={onCardTouchEnd}
      onTouchCancel={onCardTouchEnd}
    >
      {/* ── Edit mode ── */}
      {editing ? (
        <form className="task-edit-row" onSubmit={handleSaveEdit}>
          <input
            ref={editTitleRef}
            className="task-edit-title"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Task name"
            autoComplete="off"
          />
          <input
            className="task-edit-mins"
            type="number"
            min="1" max="480"
            value={editMins}
            onChange={e => setEditMins(e.target.value)}
          />
          <span className="task-edit-mins-label">m</span>
          <button type="submit" className="task-edit-save" aria-label="Save">✓</button>
          <button type="button" className="task-edit-cancel" onClick={handleCancelEdit} aria-label="Cancel">✕</button>
        </form>
      ) : (
        /* ── Normal main row ── */
        <div
          className="task-main-row"
          onClick={handleCardTap}
          onTouchStart={onTitleTouchStart}
          onTouchEnd={onTitleTouchEnd}
          onTouchMove={onTitleTouchMove}
        >
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

          {!task.completed && schedStart && (
            <div className="task-sched-time">
              <span>{fmtT(schedStart)}</span>
              <span>{fmtT(schedEnd)}</span>
            </div>
          )}

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
      )}

      {/* ── Action row ── */}
      {!task.completed && !editing && (
        <div className="task-action-row">
          <span className={`task-action-time${isOvertime ? ' overtime' : ''}`}>
            {isOvertime ? '+' : ''}{timeLabel}
          </span>
          <button className="task-action-btn danger"  onClick={e => { e.stopPropagation(); haptic(30); onDelete(task.id) }}>Delete</button>
          <button className="task-action-btn"         onClick={e => { e.stopPropagation(); onReset(task.id) }}>Reset</button>
          <button className="task-action-btn"         onClick={e => { e.stopPropagation(); onMoveTop(task.id) }}>Top</button>
          <button className="task-action-btn accent"  onClick={e => { e.stopPropagation(); haptic(50); onComplete(task.id) }}>Complete</button>
          <span
            className={`task-action-elapsed${isActive ? ' task-elapsed-tap' : ''}`}
            onClick={e => { e.stopPropagation(); if (isActive) setShowElapsed(v => !v) }}
            title={isActive ? 'Tap to toggle remaining/elapsed' : undefined}
          >
            {isActive && !showElapsed
              ? (isOvertime ? '+' : '') + formatMMSS(Math.abs(displaySec))
              : elapsedLabel
            }
          </span>
        </div>
      )}
    </div>
  )

  return (
    <>
      {task.completed ? inner : (
        <div className="task-swipe-wrapper">
          {swipeDir === 'complete' && (
            <div className="swipe-bg swipe-bg-complete">✓ Complete</div>
          )}
          {swipeDir === 'delete' && (
            <div className="swipe-bg swipe-bg-delete">Delete ✕</div>
          )}
          {inner}
        </div>
      )}

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
