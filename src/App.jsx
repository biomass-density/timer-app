import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWakeLock } from './hooks/useWakeLock'
import { generateId, getTodayDate, parseTaskInput, getNextColor, formatToday, applyEmojiTheme, applyColorTheme } from './utils/taskUtils'
import { projectedEndTime, formatMinutesLabel } from './utils/timeUtils'
import { playChime, playAlarmBell, startSoundscape, stopSoundscape, playCompletionSound } from './utils/audioUtils'
import { launchConfetti } from './utils/confetti'
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
}

const EMPTY_TIMER = {
  activeTaskId: null,
  startTimestamp: null,
  accumulatedSeconds: 0,
  isRunning: false,
}

export default function App() {
  const today = getTodayDate()
  useWakeLock()

  const [tasks, setTasks] = useLocalStorage(`ft_tasks_${today}`, [])
  const [timerState, setTimerState] = useLocalStorage('ft_timer', EMPTY_TIMER)
  const [settings, setSettings] = useLocalStorage('ft_settings', DEFAULT_SETTINGS)
  const [presets, setPresets] = useLocalStorage('ft_presets', [])
  const [sessions, setSessions] = useLocalStorage('ft_sessions', [])
  const [activeTab, setActiveTab] = useState('home')
  const [elapsed, setElapsed] = useState(0)
  const [flashOvertime, setFlashOvertime] = useState(false)

  // Quick-add lives at App level so FAB is always accessible
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickInput, setQuickInput] = useState('')
  const quickInputRef = useRef(null)

  const intervalRef = useRef(null)
  const chimeCountRef = useRef(0)
  const nagRef = useRef(null)
  const sessionStartRef = useRef(null)

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

  // ── Overtime alarm ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTask || !timerState.isRunning) {
      setFlashOvertime(false)
      clearInterval(nagRef.current)
      return
    }
    const remaining = activeTask.durationMinutes * 60 - elapsed
    if (remaining < 0) {
      if (settings.alarmType === 'visual') setFlashOvertime(true)
      if (settings.alarmType === 'continuous' && Math.abs(remaining) % 3 === 0) playAlarmBell()
      if (settings.alarmType === 'nag' && !nagRef.current) {
        nagRef.current = setInterval(() => playAlarmBell(), 60000)
        playAlarmBell()
      }
    } else {
      setFlashOvertime(false)
      clearInterval(nagRef.current)
      nagRef.current = null
    }
    return () => clearInterval(nagRef.current)
  }, [elapsed, activeTask, timerState.isRunning, settings.alarmType])

  // ── Soundscape ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (settings.soundscape) {
      startSoundscape(settings.soundscape, settings.soundscapeVolume)
    } else {
      stopSoundscape()
    }
    return stopSoundscape
  }, [settings.soundscape, settings.soundscapeVolume])

  // ── Timer controls ───────────────────────────────────────────────────────
  const startTask = useCallback((taskId) => {
    sessionStartRef.current = Date.now()
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
    setTimerState(prev => ({ ...prev, startTimestamp: Date.now(), isRunning: true }))
  }, [setTimerState])

  const toggleTimer = useCallback(() => {
    if (timerState.isRunning) pauseTimer()
    else if (timerState.activeTaskId) resumeTimer()
  }, [timerState.isRunning, timerState.activeTaskId, pauseTimer, resumeTimer])

  const adjustTime = useCallback((deltaSeconds) => {
    setTimerState(prev => {
      const live = prev.isRunning && prev.startTimestamp
        ? Math.floor((Date.now() - prev.startTimestamp) / 1000)
        : 0
      const newAccum = Math.max(0, prev.accumulatedSeconds + live + deltaSeconds)
      return { ...prev, accumulatedSeconds: newAccum, startTimestamp: prev.isRunning ? Date.now() : prev.startTimestamp }
    })
  }, [setTimerState])

  const completeTask = useCallback((taskId) => {
    // Record session
    if (sessionStartRef.current) {
      const t = tasks.find(x => x.id === taskId)
      if (t) {
        setSessions(prev => [...prev, {
          id: generateId(),
          taskId,
          taskTitle: t.title,
          taskEmoji: t.emoji,
          startTime: sessionStartRef.current,
          endTime: Date.now(),
          plannedSeconds: t.durationMinutes * 60,
          actualSeconds: elapsed,
        }])
      }
      sessionStartRef.current = null
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, actualSeconds: elapsed } : t))

    if (timerState.activeTaskId === taskId) {
      setTimerState(EMPTY_TIMER)
    }

    playCompletionSound(settings.completionSound)

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
  }, [tasks, timerState.activeTaskId, elapsed, settings.completionSound, settings.confettiEnabled, setTasks, setTimerState, setSessions])

  // ── Task CRUD ────────────────────────────────────────────────────────────
  // addTask: ID generated outside the updater so StrictMode double-invoke is idempotent
  const addTask = useCallback((input, position = 'bottom') => {
    const { title, minutes } = parseTaskInput(input)
    const newId = generateId()
    const date = today
    setTasks(prev => {
      // Guard: if already present (StrictMode double-invoke), skip
      if (prev.some(t => t.id === newId)) return prev
      const task = {
        id: newId,
        title,
        emoji: '✨',
        color: getNextColor(prev),
        durationMinutes: minutes,
        completed: false,
        recurring: false,
        date,
        actualSeconds: 0,
      }
      return position === 'top' ? [task, ...prev] : [...prev, task]
    })
  }, [today, setTasks])

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
    setActiveTab('timer')
  }, [tasks, startTask])

  // ── Presets ──────────────────────────────────────────────────────────────
  const savePreset = useCallback((name) => {
    setTasks(prev => {
      const presetTasks = prev.filter(t => !t.completed).map(({ title, emoji, color, durationMinutes, recurring }) =>
        ({ title, emoji, color, durationMinutes, recurring })
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
    setTasks(prev => applyEmojiTheme(prev, themeId))
  }, [setTasks])

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
    addTask(val)
    setQuickInput('')
    setShowQuickAdd(false)
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
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
    addTask, startTask, pauseTimer, resumeTimer, toggleTimer, adjustTime,
    completeTask, deleteTask, moveToTop, updateTask, reorderTasks, pickRandom,
    onEmojiTheme, onColorTheme, resetTask, clearCompleted,
    totalRemainingSeconds, endTime, totalListMinutes, flashOvertime,
    // Quick-add (HomeView renders inline bar)
    showQuickAdd, quickInput, setQuickInput,
    onSubmitQuickAdd: handleQuickAdd,
    onCancelQuickAdd: () => { setShowQuickAdd(false); setQuickInput('') },
    quickInputRef,
  }

  return (
    <div className="app-shell">
      <div className={`app-frame${flashOvertime ? ' overtime-flash' : ''}`}>
        <Header
          dateLabel={formatToday()}
          totalListMinutes={totalListMinutes}
          endTime={endTime}
          hasActiveTasks={incompleteTasks.length > 0}
        />

        <main className={`view-content${activeTab === 'home' ? ' view-home' : ''}`}>
          {activeTab === 'home'     && <HomeView {...shared} />}
          {activeTab === 'list'     && <ListView {...shared} />}
          {activeTab === 'settings' && <SettingsView {...shared} />}
        </main>

        {/* FAB — opens inline quick-add at top of task list */}
        {activeTab === 'home' && (
          <button
            className="fab"
            onClick={handleFab}
            aria-label={showQuickAdd ? 'Close add task' : 'Open add task'}
          >
            {showQuickAdd
              ? <span style={{ display: 'block', lineHeight: 1, fontSize: 26, fontWeight: 300 }}>×</span>
              : <span style={{ display: 'block', lineHeight: 1, fontSize: 28 }}>+</span>
            }
          </button>
        )}

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}
