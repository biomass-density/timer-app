let ctx = null

function getCtx() {
  // Recreate if closed — iOS Safari closes the context when the tab is backgrounded
  if (ctx?.state === 'closed') ctx = null
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Call from a user gesture (e.g. tapping play). iOS keeps the AudioContext
// muted until a sound is started inside a real interaction, so chimes that
// later fire from a setInterval tick would otherwise be silent.
export function unlockAudio() {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    gain.gain.value = 0.0001 // effectively silent
    osc.connect(gain); gain.connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.01)
  } catch {}
}

export function playChime() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const notes = [[523.25, 0], [659.25, 0.12], [783.99, 0.24]]
    notes.forEach(([freq, delay]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + delay
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8)
      osc.start(t); osc.stop(t + 1.8)
    })
  } catch {}
}

export function playAlarmBell() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    for (let i = 0; i < 4; i++) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'triangle'
      osc.frequency.value = 880
      const t = now + i * 0.35
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.start(t); osc.stop(t + 0.3)
    }
  } catch {}
}

// ── Soundscape state ──────────────────────────────────────────────────────────
// audioEl  → HTML5 Audio for real recordings (rain, café, beach, forest)
// soundNodes + soundGain → Web Audio for synthesised noise (brown, white)
let audioEl   = null
let soundNodes = []
let soundGain  = null

// Real-recording URLs (CC0, streamed from the Internet Archive)
const REAL_SOUNDS = {
  rain:   'https://archive.org/download/rain-sounds-gentle-rain-thunderstorms/soft-rain-ambient-111154.mp3',
  cafe:   'https://archive.org/download/coffee-shop-sounds-12/Coffee%20Shop%20Sounds%2016.mp3',
  beach:  'https://archive.org/download/naturesounds-soundtheraphy/Birds%20With%20Ocean%20Waves%20on%20the%20Beach.mp3',
  forest: 'https://archive.org/download/naturesounds-soundtheraphy/Relaxing%20Nature%20Sounds%20-%20Trickling%20Stream%20Sounds%20%26%20Birds.mp3',
}

export function stopSoundscape() {
  // HTML5 audio
  if (audioEl) {
    audioEl.pause()
    audioEl.src = ''
    audioEl = null
  }
  // Synthesised Web Audio
  soundNodes.forEach(n => { try { n.stop() } catch {} })
  soundNodes.forEach(n => { try { n.disconnect() } catch {} })
  soundNodes = []
  try { soundGain?.disconnect() } catch {}
  soundGain = null
}

// Retry playing the soundscape after the first user gesture
// (browsers block autoplay until the user interacts with the page)
export function resumeSoundscape() {
  if (audioEl && audioEl.paused) {
    audioEl.play().catch(() => {})
  }
}

function makeNoiseBuf(ac, seconds = 4) {
  const len = ac.sampleRate * seconds
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  return buf
}

function makeBrownBuf(ac, coeff = 0.02, gain = 3.5, seconds = 4) {
  const len = ac.sampleRate * seconds
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + coeff * w) / (1 + coeff)
      d[i] = last * gain
    }
  }
  return buf
}

export function startSoundscape(type, volume = 0.4) {
  stopSoundscape()

  // ── Real recording ───────────────────────────────────────────────────────
  const url = REAL_SOUNDS[type]
  if (url) {
    audioEl = new Audio(url)
    audioEl.loop   = true
    audioEl.volume = Math.min(1, volume)
    // Suppress autoplay-policy rejections — resumeSoundscape() retries on interaction
    audioEl.play().catch(() => {})
    return
  }

  // ── Synthesised: brown noise ──────────────────────────────────────────────
  try {
    const ac = getCtx()
    soundGain = ac.createGain()
    soundGain.gain.value = volume
    soundGain.connect(ac.destination)

    if (type === 'brown') {
      const src = ac.createBufferSource()
      src.buffer = makeBrownBuf(ac)
      src.loop = true
      src.connect(soundGain)
      src.start()
      soundNodes.push(src)

    } else if (type === 'white') {
      const src = ac.createBufferSource()
      src.buffer = makeNoiseBuf(ac)
      src.loop = true
      src.connect(soundGain)
      src.start()
      soundNodes.push(src)
    }
  } catch {}
}

export function setSoundscapeVolume(vol) {
  if (audioEl)   audioEl.volume = Math.min(1, vol)
  if (soundGain) soundGain.gain.value = vol
}

// ── Completion sounds ─────────────────────────────────────────────────────────
function playTada(ac) {
  [261.63, 329.63, 392, 523.25].forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = ac.currentTime + i * 0.09
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.28, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    osc.start(t); osc.stop(t + 0.6)
  })
}

function playFanfare(ac) {
  [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ac.createOscillator()
    const filt = ac.createBiquadFilter()
    const gain = ac.createGain()
    filt.type = 'lowpass'; filt.frequency.value = 2400
    osc.connect(filt); filt.connect(gain); gain.connect(ac.destination)
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const t = ac.currentTime + i * 0.11
    const hold = i === 3 ? 0.5 : 0.18
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + hold)
    osc.start(t); osc.stop(t + hold)
  })
}

export function playCompletionSound(type) {
  if (!type || type === 'none') return
  try {
    const ac = getCtx()
    if (type === 'chime')   { playChime();      return }
    if (type === 'bell')    { playAlarmBell();  return }
    if (type === 'tada')    { playTada(ac);     return }
    if (type === 'fanfare') { playFanfare(ac);  return }
  } catch {}
}
