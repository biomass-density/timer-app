const FEATURES = [
  { icon: '⏱️', title: 'Task timers', desc: 'One focused countdown per task. Accurate even in the background.' },
  { icon: '⚡', title: 'Quick add', desc: 'Type "Meeting 45" to create a 45-min task instantly.' },
  { icon: '🕐', title: 'End time', desc: "See exactly when you'll finish. Recalculates as you work." },
  { icon: '🔴', title: 'Overtime', desc: 'Timer keeps counting up past zero so all time is tracked.' },
  { icon: '🎨', title: 'Personalise', desc: 'Each task gets your chosen emoji and one of 8 colors.' },
  { icon: '📋', title: 'Preset lists', desc: 'Save and reload task templates — like "Morning routine".' },
  { icon: '🔔', title: 'Chimes', desc: 'Soft bell at a chosen interval to keep you on track.' },
  { icon: '🚨', title: 'Alarm types', desc: 'Visual flash, nag (repeats) or continuous chime on overtime.' },
  { icon: '🌧️', title: 'Soundscapes', desc: 'Looping rain, café, or brown noise to help you focus.' },
  { icon: '🎲', title: 'Random task', desc: '"Pick one for me" — no more decision fatigue.' },
  { icon: '↕️', title: 'Drag to reorder', desc: 'Rearrange your list by dragging tasks up or down.' },
  { icon: '🎉', title: 'Confetti', desc: 'Celebrate every completed task — big party when the list is done.' },
  { icon: '🔁', title: 'Recurring tasks', desc: 'Mark tasks as recurring so they show up every day.' },
  { icon: '📱', title: 'Mobile first', desc: 'Designed for one-thumb use on iOS Safari.' },
  { icon: '💾', title: 'Offline & private', desc: 'No account, no server. All data stays on your device.' },
  { icon: '🔆', title: 'Screen awake', desc: 'Wake lock keeps your screen on while timing.' },
]

export default function FeaturesView() {
  return (
    <div className="features-view">
      <h2>Features</h2>
      <p className="features-sub">Everything you need to make time feel real</p>
      <div className="features-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
            <div className="fc-icon">{f.icon}</div>
            <div className="fc-title">{f.title}</div>
            <div className="fc-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
