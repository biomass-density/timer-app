import { useState } from 'react'
import { TASK_COLORS, COLOR_KEYS, EMOJI_CATEGORIES } from '../utils/taskUtils'

// Open on the tab that already contains the task's current emoji (fall back to Popular)
function initialCategory(emoji) {
  const idx = EMOJI_CATEGORIES.findIndex(c => c.emojis.includes(emoji))
  return idx >= 0 ? idx : 0
}

export default function EmojiColorPicker({ task, onUpdate, onClose }) {
  const [emoji, setEmoji] = useState(task.emoji)
  const [color, setColor] = useState(task.color)
  const [cat, setCat] = useState(() => initialCategory(task.emoji))

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
        <div className="emoji-cat-tabs">
          {EMOJI_CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              className={`emoji-cat-tab${cat === i ? ' selected' : ''}`}
              onClick={() => setCat(i)}
              title={c.name}
              aria-label={c.name}
            >
              {c.icon}
            </button>
          ))}
        </div>
        <div className="emoji-grid">
          {EMOJI_CATEGORIES[cat].emojis.map((e, i) => (
            <button
              key={`${e}-${i}`}
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
