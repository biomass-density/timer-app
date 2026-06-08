import { useState } from 'react'
import { startSoundscape, stopSoundscape, setSoundscapeVolume } from '../utils/audioUtils'
import { signInWithGoogle, signOut } from '../lib/firebase'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
}

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

export default function SettingsView({ settings, setSettings, presets, savePreset, loadPreset, deletePreset, tasks, user }) {
  const [presetName, setPresetName] = useState('')
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  function handleSignIn() {
    setAuthError('')
    setSigningIn(true)
    signInWithGoogle()
      .catch(e => setAuthError(e?.message || 'Sign-in failed'))
      .finally(() => setSigningIn(false))
  }

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

      {/* Account / sync */}
      <div className="settings-section-label">Account</div>
      <div className="settings-section">
        {user ? (
          <div className="setting-row">
            {user.photoURL
              ? <img className="account-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              : <span className="setting-row-icon">👤</span>}
            <div className="setting-row-info">
              <div className="setting-row-label">{user.displayName || 'Signed in'}</div>
              <div className="setting-row-desc">{user.email} · syncing across your devices</div>
            </div>
            <button className="account-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        ) : (
          <div className="setting-row setting-row-stack">
            <div className="setting-row-info">
              <div className="setting-row-label">Sync across devices</div>
              <div className="setting-row-desc">Sign in to sync your tasks, timer and settings between phone and desktop. The app works fine without it too.</div>
            </div>
            <button className="google-signin-btn" onClick={handleSignIn} disabled={signingIn}>
              <GoogleIcon />
              {signingIn ? 'Signing in…' : 'Sign in with Google'}
            </button>
            {authError && <div className="setting-row-desc" style={{ color: 'var(--overtime)' }}>{authError}</div>}
          </div>
        )}
      </div>

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
          <span className="setting-row-icon">🕰️</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Ticking sound</div>
            <div className="setting-row-desc">Soft tick every second while a timer is running</div>
          </div>
          <Toggle
            checked={!!settings.tickingSound}
            onChange={v => updateSetting('tickingSound', v)}
          />
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

      {/* Screen */}
      <div className="settings-section-label">Screen</div>
      <div className="settings-section">
        <div className="setting-row">
          <span className="setting-row-icon">📱</span>
          <div className="setting-row-info">
            <div className="setting-row-label">Keep screen awake</div>
            <div className="setting-row-desc">Stop the display dimming or sleeping while a timer is running</div>
          </div>
          <Toggle
            checked={!!settings.keepAwake}
            onChange={v => updateSetting('keepAwake', v)}
          />
        </div>
      </div>

      {/* Smart emoji */}
      <div className="settings-section-label">Smart emoji</div>
      <div className="settings-section">
        <div className="setting-row">
          <span className="setting-row-icon">🪄</span>
          <div className="setting-row-info">
            <div className="setting-row-label">AI emoji matching</div>
            <div className="setting-row-desc">Gemini reads each task and picks the best emoji — handled on the server</div>
          </div>
          <Toggle
            checked={!!settings.aiEmoji}
            onChange={v => updateSetting('aiEmoji', v)}
          />
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
