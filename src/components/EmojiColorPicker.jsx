import { useState } from 'react'
import { TASK_COLORS, COLOR_KEYS, DEFAULT_EMOJIS } from '../utils/taskUtils'

export default function EmojiColorPicker({ task, onUpdate, onClose }) {
  const [emoji, setEmoji] = useState(task.emoji)
  const [color, setColor] = useState(task.color)

  function handleDone() {
    onUpdate({ emoji, color })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h2 className="modal-title">Personalise task</h2>

        <div className="modal-section-label">Color</div>
        <div className="color-grid">
          {COLOR_KEYS.map(key => (
            <div
              key={key}
              className={`color-swatch${color === key ? ' selected' : ''}`}
              style={{ background: TASK_COLORS[key].bg }}
              onClick={() => setColor(key)}
              title={TASK_COLORS[key].label}
            />
          ))}
        </div>

        <div className="modal-section-label">Emoji</div>
        <div className="emoji-grid">
          {DEFAULT_EMOJIS.map(e => (
            <button
              key={e}
              className={`emoji-btn${emoji === e ? ' selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <button className="modal-done-btn" onClick={handleDone}>Done</button>
      </div>
    </div>
  )
}
