import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWakeLock } from './hooks/useWakeLock'
import { generateId, getTodayDate, parseTaskInput, getNextColor, formatToday, applyEmojiTheme, applyColorTheme, getAutoEmoji } from './utils/taskUtils'
import { projectedEndTime, formatMinutesLabel } from './utils/timeUtils'
import { playChime, playAlarmBell, startSoundscape, stopSoundscape, playCompletionSound, resumeSoundscape, unlockAudio, playTick } from './utils/audioUtils'
import { launchConfetti } from './utils/confetti'
import { haptic } from './utils/haptic'
import { suggestEmojiAI } from './utils/aiEmoji'
import Header from './components/Header'
import TabBar from './components/TabBar'
import HomeView from './components/HomeView'
import ListView from './components/ListView'
import SettingsView from './components/SettingsView'

const DEFAULT_SETTINGS = {
  chimeInterval: 5,
  alarmType: 'visual',
  soundscape: null,
  soundscapeVolume: 0.5,
  confettiEnabled: true,
  completionSound: 'tada',
  defaultMinutes: 25,
  tickingSound: false,
  keepAwake: true, // hold a screen wake lock so the display never sleeps while the app is open
  aiEmoji: true, // contextual emoji via the backend; harmlessly off if the server has no key
}

const EMPTY_TIMER = {
  activeTaskId: null,
  startTimestamp: null,
  accumulatedSeconds: 0,
  isRunning: false,
}

export default function App() {
  const today = getTodayDate()

  const [tasks, setTasks] = useLocalStorage(`ft_tasks_${today}`, [])
  const [timerState, setTimerState] = useLocalStorage('ft_timer', EMPTY_TIMER)
  const [_rawSettings, setSettings] = useLocalStorage('ft_settings', DEFAULT_SETTINGS)
  // Always merge stored settings with defaults so new keys (e.g. completionSound) are never undefined
  const settings = { ...DEFAULT_SETTINGS, ..._rawSettings }
  useWakeLock(settings.keepAwake) // keep the display on while the app is open (toggle in Settings)
  const [presets, setPresets] = useLocalStorage('ft_presets', [])
  const [sessions, setSessions] = useLocalStorage('ft_sessions', [])
  const [activeTab, setActiveTab] = useState('home')
  const [elapsed, setElapsed] = useState(0)
  const [flashOvertime, setFlashOvertime] = useState(false)

  // Quick-add lives at App level so FAB is always accessible
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickInput, setQuickInput] = useState('')
  const quickInputRef = useRef(null)

  const intervalRef     = useRef(null)
  const chimeCountRef   = useRef(0)
  const tickRef         = useRef(null)
  const nagRef          = useRef(null)
  const sessionStartRef = useRef(null)
  const notifGranted    = useRef(false)
  const prevRemaining   = useRef(null)

  // ── Midnight date rollover ───────────────────────────────────────────────
  useEffect(() => {
    function checkDate() {
      if (document.visibilityState === 'visible' && getTodayDate() !== today) {
        window.location.reload()
      }
    }
    document.addEventListener('visibilitychange', checkDate)
    return () => document.removeEventListener('visibilitychange', checkDate)
  }, [today])

  // ── Roll-over: check previous days for incomplete tasks ──────────────────
  const [rolloverTasks, setRolloverTasks] = useState(null)
  useEffect(() => {
    if (tasks.length > 0) { setRolloverTasks([]); return }
    for (let d = 1; d <= 7; d++) {
      const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)
      try {
        const stored = JSON.parse(localStorage.getItem(`ft_tasks_${date}`) || '[]')
        const incomplete = stored.filter(t => !t.completed)
        if (incomplete.length > 0) { setRolloverTasks(incomplete); return }
      } catch {}
    }
    setRolloverTasks([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notification permission ───────────────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      notifGranted.current = true
    }
  }, [])

  function requestNotifPermission() {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    Notification.requestPermission().then(p => { notifGranted.current = p === 'granted' }).catch(() => {})
  }

  // ── Elapsed ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const { isRunning, startTimestamp, accumulatedSeconds } = timerState
      if (!isRunning || !startTimestamp) {
        setElapsed(accumulatedSeconds)
        return
      }
      setElapsed(accumulatedSeconds + Math.floor((Date.now() - startTimestamp) / 1000))
    }
    tick()
    clearInterval(intervalRef.current)
    if (timerState.isRunning) {
      intervalRef.current = setInterval(tick, 500)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerState])

  const activeTask = tasks.find(t => t.id === timerState.activeTaskId) ?? null

  // ── Chimes ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTask || !timerState.isRunning || settings.chimeInterval === 0) {
      chimeCountRef.current = 0
      return
    }
    const expected = Math.floor(elapsed / (settings.chimeInterval * 60))
    if (expected > chimeCountRef.current) {
      chimeCountRef.current = expected
      playChime()
    }
  }, [elapsed, activeTask, timerState.isRunning, settings.chimeInterval])

  // ── Ticking sound ────────────────────────────────────────────────────────
  // A steady once-a-second tick while the timer runs, so it's obvious it's on.
  useEffect(() => {
    clearInterval(tickRef.current)
    tickRef.current = null
    if (timerState.isRunning && settings.tickingSound) {
      playTick() // immediate tick for instant feedback
      tickRef.current = setInterval(playTick, 1000)
    }
    return () => clearInterval(tickRef.current)
  }, [timerState.isRunning, settings.tickingSound])

  // ── Overtime alarm ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTask || !timerState.isRunning) {
      setFlashOvertime(false)
      clearInterval(nagRef.current)
      nagRef.current = null
      return
    }
    const remaining = activeTask.durationMinutes * 60 - elapsed
    if (remaining < 0) {
      if (settings.alarmType === 'visual') setFlashOvertime(true)
      else setFlashOvertime(false)
      if (settings.alarmType === 'continuous' && Math.abs(remaining) % 3 === 0) playAlarmBell()
      if (settings.alarmType === 'nag') {
        if (!nagRef.current) {
          nagRef.current = setInterval(() => playAlarmBell(), 60000)
          playAlarmBell()
        }
      } else {
        // switched away from nag while overtime — stop any running nag
        clearInterval(nagRef.current)
        nagRef.current = null
      }
    } else {
      setFlashOvertime(false)
      clearInterval(nagRef.current)
      nagRef.current = null
    }
    // No cleanup return — interval is managed inline above to prevent
    // the nag from being cleared every time elapsed ticks.
  }, [elapsed, activeTask, timerState.isRunning, settings.alarmType])
  // Unmount safety: clear any lingering nag interval
  useEffect(() => () => { clearInterval(nagRef.current) }, [])

  // ── Notification: fire once when active task timer hits 0 ────────────────
  useEffect(() => {
    if (!activeTask || !timerState.isRunning) { prevRemaining.current = null; return }
    const rem = Math.floor(activeTask.durationMinutes * 60 - elapsed)
    if (prevRemaining.current > 0 && rem <= 0 && notifGranted.current) {
      try {
        new Notification(`⏰ Time's up: ${activeTask.emoji} ${activeTask.title}`, {
          body: 'Tap to get back to your tasks',
          tag: 'timer-done',
          renotify: true,
        })
      } catch {}
    }
    prevRemaining.current = rem
  }, [elapsed, activeTask, timerState.isRunning])

  // ── Soundscape ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (settings.soundscape) {
      startSoundscape(settings.soundscape, settings.soundscapeVolume)
    } else {
      stopSoundscape()
    }
    return stopSoundscape
  }, [settings.soundscape]) // volume changes are handled directly by SettingsView via setSoundscapeVolume()

  // ── Timer controls ───────────────────────────────────────────────────────

  // selectTask: preload a task into the timer WITHOUT starting it.
  // Tapping a task card calls this. The play button (toggleTimer) starts it.
  const selectTask = useCallback((taskId) => {
    setTimerState(prev => {
      // If same task is already loaded (even if running), do nothing
      if (prev.activeTaskId === taskId) return prev
      return {
        activeTaskId: taskId,
        startTimestamp: null,
        accumulatedSeconds: 0,
        isRunning: false,
      }
    })
    sessionStartRef.current = null
  }, [setTimerState])

  // Keep startTask for internal auto-advance (starts immediately)
  const startTask = useCallback((taskId) => {
    sessionStartRef.current = Date.now()
    chimeCountRef.current = 0
    setTimerState({
      activeTaskId: taskId,
      startTimestamp: Date.now(),
      accumulatedSeconds: 0,
      isRunning: true,
    })
  }, [setTimerState])

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      accumulatedSeconds: prev.accumulatedSeconds +
        (prev.startTimestamp ? Math.floor((Date.now() - prev.startTimestamp) / 1000) : 0),
      startTimestamp: null,
      isRunning: false,
    }))
  }, [setTimerState])

  const resumeTimer = useCallback(() => {
    if (!sessionStartRef.current) sessionStartRef.current = Date.now()
    requestNotifPermission()
    unlockAudio()        // unlock Web Audio (chimes/bells) on first gesture — required on iOS
    resumeSoundscape()   // unblock autoplay-gated HTML5 audio on first gesture
    setTimerState(prev => ({ ...prev, startTimestamp: Date.now(), isRunning: true }))
  }, [setTimerState]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTimer = useCallback(() => {
    haptic(10)
    if (timerState.isRunning) pauseTimer()
    else if (timerState.activeTaskId) resumeTimer()
  }, [timerState.isRunning, timerState.activeTaskId, pauseTimer, resumeTimer])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      // Space = play/pause (ignore when typing in an input or textarea)
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        if (timerState.activeTaskId) toggleTimer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timerState.activeTaskId, toggleTimer])

  const adjustTime = useCallback((deltaSeconds) => {
    setTimerState(prev => {
      const live = prev.isRunning && prev.startTimestamp
        ? Math.floor((Date.now() - prev.startTimestamp) / 1000)
        : 0
      const newAccum = prev.accumulatedSeconds + live + deltaSeconds
      return { ...prev, accumulatedSeconds: newAccum, startTimestamp: prev.isRunning ? Date.now() : prev.startTimestamp }
    })
  }, [setTimerState])

  const completeTask = useCallback((taskId) => {
    // Record session (trim entries older than 60 days to keep localStorage lean)
    const SIXTY_DAYS = 60 * 86400000
    if (sessionStartRef.current) {
      const t = tasks.find(x => x.id === taskId)
      if (t) {
        setSessions(prev => [...prev.filter(s => s.startTime >= Date.now() - SIXTY_DAYS), {
          id: generateId(),
          taskId,
          taskTitle: t.title,
          taskEmoji: t.emoji,
          startTime: sessionStartRef.current,
          endTime: Date.now(),
          plannedSeconds: t.durationMinutes * 60,
          actualSeconds: Math.max(0, elapsed),
        }])
      }
      sessionStartRef.current = null
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, actualSeconds: Math.max(0, elapsed) } : t))

    // Auto-advance: start the next incomplete task immediately
    if (timerState.activeTaskId === taskId) {
      const nextTask = tasks.find(t => !t.completed && t.id !== taskId)
      if (nextTask) {
        startTask(nextTask.id)
      } else {
        setTimerState(EMPTY_TIMER)
      }
    }

    playCompletionSound(settings.completionSound ?? 'tada')

    if (settings.confettiEnabled) {
      launchConfetti({ big: false })
      // Big confetti if this was the last task
      setTimeout(() => {
        setTasks(prev => {
          const stillLeft = prev.filter(t => !t.completed && t.id !== taskId)
          if (stillLeft.length === 0) launchConfetti({ big: true })
          return prev
        })
      }, 500)
    }
  }, [tasks, timerState.activeTaskId, elapsed, settings.completionSound, settings.confettiEnabled, setTasks, setTimerState, setSessions, startTask])

  // ── Task CRUD ────────────────────────────────────────────────────────────
  // Upgrade a task's emoji with a contextual AI pick (no-op without a key).
  // The heuristic emoji is already set, so this just refines it in place.
  const refineEmojiAI = useCallback((taskId, title) => {
    if (!settings.aiEmoji) return
    suggestEmojiAI(title)
      .then(emoji => {
        if (emoji) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, emoji } : t))
      })
      .catch(() => {}) // network/server error → keep the offline guess
  }, [settings.aiEmoji, setTasks])

  // addTask: ID generated outside the updater so StrictMode double-invoke is idempotent
  const addTask = useCallback((input, position = 'bottom', defaultMinutes = 25) => {
    const { title, minutes } = parseTaskInput(input, defaultMinutes)
    const newId = generateId()
    const date = today
    setTasks(prev => {
      // Guard: if already present (StrictMode double-invoke), skip
      if (prev.some(t => t.id === newId)) return prev
      const task = {
        id: newId,
        title,
        emoji: getAutoEmoji(title),
        color: getNextColor(prev),
        durationMinutes: minutes,
        completed: false,
        date,
        actualSeconds: 0,
      }
      return position === 'top' ? [task, ...prev] : [...prev, task]
    })
    refineEmojiAI(newId, title)
  }, [today, setTasks, refineEmojiAI])

  const deleteTask = useCallback((taskId) => {
    if (timerState.activeTaskId === taskId) setTimerState(EMPTY_TIMER)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [timerState.activeTaskId, setTasks, setTimerState])

  const moveToTop = useCallback((taskId) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === taskId)
      return t ? [t, ...prev.filter(x => x.id !== taskId)] : prev
    })
  }, [setTasks])

  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
  }, [setTasks])

  const reorderTasks = useCallback((newList) => setTasks(newList), [setTasks])

  const pickRandom = useCallback(() => {
    const incomplete = tasks.filter(t => !t.completed)
    if (!incomplete.length) return
    const pick = incomplete[Math.floor(Math.random() * incomplete.length)]
    startTask(pick.id)
    setActiveTab('home')
  }, [tasks, startTask])

  // ── Presets ──────────────────────────────────────────────────────────────
  const savePreset = useCallback((name) => {
    setTasks(prev => {
      const presetTasks = prev.filter(t => !t.completed).map(({ title, emoji, color, durationMinutes }) =>
        ({ title, emoji, color, durationMinutes })
      )
      setPresets(p => [...p.filter(x => x.name !== name), { id: generateId(), name, tasks: presetTasks }])
      return prev
    })
  }, [setTasks, setPresets])

  const loadPreset = useCallback((preset) => {
    // Generate IDs outside the updater for StrictMode safety
    const loaded = preset.tasks.map(t => ({ ...t, id: generateId(), completed: false, date: today, actualSeconds: 0 }))
    setTasks(prev => {
      const existingIds = new Set(prev.map(t => t.id))
      const fresh = loaded.filter(t => !existingIds.has(t.id))
      return fresh.length ? [...prev, ...fresh] : prev
    })
  }, [today, setTasks])

  const deletePreset = useCallback((id) => setPresets(prev => prev.filter(p => p.id !== id)), [setPresets])

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.completed))
  }, [setTasks])

  // ── Reset task timer ─────────────────────────────────────────────────────
  const resetTask = useCallback((taskId) => {
    // Reset elapsed time back to 0
    if (timerState.activeTaskId === taskId) {
      setTimerState(prev => ({
        ...prev,
        accumulatedSeconds: 0,
        startTimestamp: prev.isRunning ? Date.now() : null,
      }))
    }
    // Also clear any partial actualSeconds on the task itself
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, actualSeconds: 0 } : t))
  }, [timerState.activeTaskId, setTimerState, setTasks])

  // ── Emoji / color themes ─────────────────────────────────────────────────
  const onEmojiTheme = useCallback((themeId) => {
    // Instant heuristic pass first…
    setTasks(prev => applyEmojiTheme(prev, themeId))
    // …then, for "Match tasks!", let AI refine each title contextually.
    if (themeId === 'auto' && settings.aiEmoji) {
      Promise.all(tasks.map(t =>
        suggestEmojiAI(t.title)
          .then(emoji => ({ id: t.id, emoji }))
          .catch(() => ({ id: t.id, emoji: null }))
      )).then(results => {
        const byId = new Map(results.map(r => [r.id, r.emoji]))
        setTasks(prev => prev.map(t => byId.get(t.id) ? { ...t, emoji: byId.get(t.id) } : t))
      })
    }
  }, [setTasks, tasks, settings.aiEmoji])

  const onColorTheme = useCallback((themeId) => {
    setTasks(prev => applyColorTheme(prev, themeId))
  }, [setTasks])

  // ── Quick add handlers ───────────────────────────────────────────────────
  function handleFab() {
    setShowQuickAdd(v => {
      if (!v) setTimeout(() => quickInputRef.current?.focus(), 80)
      return !v
    })
  }

  function handleQuickAdd(e) {
    e?.preventDefault()
    const val = quickInput.trim()
    if (!val) return
    addTask(val, 'bottom', settings.defaultMinutes ?? 25)
    setQuickInput('')
    setShowQuickAdd(false)
  }

  // ── Roll-over handler ────────────────────────────────────────────────────
  const handleRollover = useCallback(() => {
    if (!rolloverTasks?.length) return
    const loaded = rolloverTasks.map(t => ({
      ...t, id: generateId(), date: today, actualSeconds: 0, completed: false,
    }))
    setTasks(prev => {
      const existingIds = new Set(prev.map(t => t.id))
      const fresh = loaded.filter(t => !existingIds.has(t.id))
      return fresh.length ? [...prev, ...fresh] : prev
    })
    setRolloverTasks([])
  }, [rolloverTasks, today, setTasks])

  // ── Derived values ───────────────────────────────────────────────────────
  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
  // How much focused time has been logged today (completed sessions only)
  const doneToday = sessions
    .filter(s => new Date(s.startTime).toISOString().slice(0, 10) === today)
    .reduce((sum, s) => sum + (s.actualSeconds || 0), 0)

  const activeRemainSec = activeTask ? Math.max(0, activeTask.durationMinutes * 60 - elapsed) : 0
  const futureTasksSec = incompleteTasks.filter(t => t.id !== timerState.activeTaskId).reduce((s, t) => s + t.durationMinutes * 60, 0)
  const totalRemainingSeconds = activeRemainSec + futureTasksSec
  const endTime = projectedEndTime(totalRemainingSeconds)
  const totalListMinutes = incompleteTasks.reduce((s, t) => s + t.durationMinutes, 0)

  const shared = {
    tasks, incompleteTasks, completedTasks,
    timerState, elapsed, activeTask,
    settings, setSettings,
    presets, savePreset, loadPreset, deletePreset,
    sessions,
    addTask, selectTask, startTask, pauseTimer, resumeTimer, toggleTimer, adjustTime,
    completeTask, deleteTask, moveToTop, updateTask, reorderTasks, pickRandom,
    onEmojiTheme, onColorTheme, resetTask, clearCompleted,
    totalRemainingSeconds, endTime, totalListMinutes, flashOvertime,
    // Quick-add (HomeView renders inline bar)
    showQuickAdd, quickInput, setQuickInput,
    onSubmitQuickAdd: handleQuickAdd,
    onCancelQuickAdd: () => { setShowQuickAdd(false); setQuickInput('') },
    quickInputRef,
    // Roll-over
    rolloverTasks,
    onRollover: handleRollover,
    onDismissRollover: () => setRolloverTasks([]),
    // Stats
    doneToday,
  }

  return (
    <div className="app-shell">
      <div className={`app-frame${flashOvertime ? ' overtime-flash' : ''}`}>
        <Header
          dateLabel={formatToday()}
          totalListMinutes={totalListMinutes}
          endTime={endTime}
          hasActiveTasks={incompleteTasks.length > 0}
          doneToday={doneToday}
        />

        <main className={`view-content${activeTab === 'home' ? ' view-home' : ''}`}>
          {activeTab === 'home'     && <HomeView {...shared} />}
          {activeTab === 'list'     && <ListView {...shared} />}
          {activeTab === 'settings' && <SettingsView {...shared} />}
        </main>

        {/* Quick-add bottom bar — sits flush above the tab bar */}
        {activeTab === 'home' && showQuickAdd && (
          <form className="quick-add-bottom-bar" onSubmit={handleQuickAdd}>
            <span className="quick-add-emoji-preview">
              {quickInput.trim() ? getAutoEmoji(quickInput) : '✨'}
            </span>
            <input
              ref={quickInputRef}
              className="quick-add-bottom-input"
              placeholder='e.g. "Deep work 45" or "Email"'
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(e) } }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="done"
            />
            <button type="submit" className="quick-add-bottom-submit">Add</button>
            <button
              type="button"
              className="quick-add-bottom-cancel"
              onClick={() => { setShowQuickAdd(false); setQuickInput('') }}
              aria-label="Cancel"
            >×</button>
          </form>
        )}

        {/* FAB — hidden while quick-add bar is open */}
        {activeTab === 'home' && !showQuickAdd && (
          <button className="fab" onClick={handleFab} aria-label="Add task">
            <span style={{ display: 'block', lineHeight: 1, fontSize: 28 }}>+</span>
          </button>
        )}

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}
