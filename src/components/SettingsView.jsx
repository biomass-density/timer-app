import { useState } from 'react'
import { startSoundscape, stopSoundscape, setSoundscapeVolume } from '../utils/audioUtils'

const SOUNDSCAPES = [
  { value: '',       label: 'None' },
  { value: 'rain',   label: '🌧️ Rain' },
  { value: 'cafe',   label: '☕ Café' },
  { value: 'beach',  label: '🏖️ Beach' },
  { value: 'forest', label: '🌿 Forest' },
  { value: 'brown',  label: '🟤 Brown noise' },
  { value: 'white',  label: '⬜ White noise' },
]

const ALARM_TYPES = [
  { value: 'silent',     label: 'Silent' },
  { value: 'visual',     label: 'Visual flash' },
  { value: 'nag',        label: 'Nag (repeats)' },
  { value: 'continuous', label: 'Continuous chime' },
]

const COMPLETION_SOUNDS = [
  { value: 'none',    label: 'None' },
  { value: 'chime',   label: '🔔 Chime' },
  { value: 'tada',    label: '🎵 Tada' },
  { value: 'fanfare', label: '🎺 Fanfare' },
  { value: 'bell',    label: '🔔 Bell' },
]

const CHIME_INTERVALS = [
  { value: 0,  label: 'Off' },
  { value: 5,  label: 'Every 5 min' },
  { value: 10, label: 'Every 10 min' },
  { value: 15, label: 'Every 15 min' },
  { value: 20, label: 'Every 20 min' },
  { value: 30, label: 'Every 30 min' },
]

const DEFAULT_DURATIONS = [
  { value: 5,  label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 25, label: '25 min (Pomodoro)' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="toggle-track" />
      <div className="toggle-thumb" />
    </label>
  )
}

export default function SettingsView({ settings, setSettings, presets, savePreset, loadPreset, deletePreset, tasks }) {
  const [presetName, setPresetName] = useState('')

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function handleSoundscape(value) {
    updateSetting('soundscape', value || null)
  }

  function handleVolume(val) {
    updateSetting('soundscapeVolume', val)
    setSoundscapeVolume(val)
  }

  function handleSavePreset() {
    const name = presetName.trim()
    if (!name) return
    savePreset(name)
    setPresetName('')
  }

  return (
    <div className="settings-view">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Settings</h2>

      {/* Sound & chimes */}
      <div className="settings-section-label">Sound</div>
      <div className="settings-section">
        <div className="setting-row">
          <span className="setting-row-icon">🔔</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Chime interval</div>
            <div className="setting-row-desc">Bell reminder during a task</div>
          </div>
          <select
            className="setting-select"
            value={settings.chimeInterval}
            onChange={e => updateSetting('chimeInterval', Number(e.target.value))}
          >
            {CHIME_INTERVALS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <span className="setting-row-icon">✅</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Completion sound</div>
            <div className="setting-row-desc">Plays when you complete a task</div>
          </div>
          <select
            className="setting-select"
            value={settings.completionSound ?? 'tada'}
            onChange={e => updateSetting('completionSound', e.target.value)}
          >
            {COMPLETION_SOUNDS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <span className="setting-row-icon">🚨</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Overtime alarm</div>
            <div className="setting-row-desc">What happens when timer hits zero</div>
          </div>
          <select
            className="setting-select"
            value={settings.alarmType}
            onChange={e => updateSetting('alarmType', e.target.value)}
          >
            {ALARM_TYPES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <span className="setting-row-icon">🎧</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Soundscape</div>
            <div className="setting-row-desc">Background ambient sound</div>
          </div>
          <select
            className="setting-select"
            value={settings.soundscape ?? ''}
            onChange={e => handleSoundscape(e.target.value)}
          >
            {SOUNDSCAPES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {settings.soundscape && (
          <div className="setting-row">
            <span className="setting-row-icon">🔊</span>
            <div className="setting-row-info">
              <div className="setting-row-label">Volume</div>
            </div>
            <input
              type="range"
              className="volume-slider"
              min="0" max="1" step="0.05"
              value={settings.soundscapeVolume}
              onChange={e => handleVolume(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="settings-section-label">Tasks</div>
      <div className="settings-section">
        <div className="setting-row">
          <span className="setting-row-icon">⏱️</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Default duration</div>
            <div className="setting-row-desc">Used when no number is typed</div>
          </div>
          <select
            className="setting-select"
            value={settings.defaultMinutes ?? 25}
            onChange={e => updateSetting('defaultMinutes', Number(e.target.value))}
          >
            {DEFAULT_DURATIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visuals */}
      <div className="settings-section-label">Visuals</div>
      <div className="settings-section">
        <div className="setting-row">
          <span className="setting-row-icon">🎉</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Confetti on complete</div>
            <div className="setting-row-desc">Celebrate finishing tasks</div>
          </div>
          <Toggle
            checked={settings.confettiEnabled}
            onChange={v => updateSetting('confettiEnabled', v)}
          />
        </div>
      </div>

      {/* Presets */}
      <div className="settings-section-label">Preset lists</div>
      <div className="settings-section">
        {presets.length === 0 && (
          <div style={{ padding: '14px 16px', color: 'var(--text-3)', fontSize: 14 }}>
            No presets saved yet. Save your current task list as a template.
          </div>
        )}
        {presets.map(preset => (
          <div key={preset.id} className="preset-item">
            <div>
              <div className="preset-name">{preset.name}</div>
              <div className="preset-count">{preset.tasks.length} tasks</div>
            </div>
            <button className="preset-load-btn" onClick={() => loadPreset(preset)}>Load</button>
            <button className="preset-del-btn" onClick={() => deletePreset(preset.id)}>✕</button>
          </div>
        ))}
        <div className="save-preset-row">
          <input
            className="save-preset-input"
            placeholder="Preset name (e.g. Morning)"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
          />
          <button className="save-preset-btn" onClick={handleSavePreset}>Save</button>
        </div>
      </div>

      <div style={{ height: 16 }} />
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', paddingBottom: 8 }}>
        🦝 Focus Timer · All data stored locally
      </p>
    </div>
  )
}
