let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playChime() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    // Three-note ascending bell chord
    [[523.25, 0], [659.25, 0.12], [783.99, 0.24]].forEach(([freq, delay]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + delay
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8)
      osc.start(t)
      osc.stop(t + 1.8)
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
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'triangle'
      osc.frequency.value = 880
      const t = now + i * 0.35
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.start(t)
      osc.stop(t + 0.3)
    }
  } catch {}
}

// Soundscape state
let soundNode = null
let soundGain = null

export function startSoundscape(type, volume = 0.4) {
  stopSoundscape()
  try {
    const ac = getCtx()
    soundGain = ac.createGain()
    soundGain.gain.value = volume
    soundGain.connect(ac.destination)

    const bufLen = ac.sampleRate * 4
    const buf = ac.createBuffer(2, bufLen, ac.sampleRate)

    if (type === 'rain') {
      // Bandpass-filtered noise — sounds like rain
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch)
        for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      src.loop = true
      const filt = ac.createBiquadFilter()
      filt.type = 'bandpass'
      filt.frequency.value = 600
      filt.Q.value = 0.4
      src.connect(filt)
      filt.connect(soundGain)
      src.start()
      soundNode = src
    } else if (type === 'brown') {
      // Brown noise
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch)
        let last = 0
        for (let i = 0; i < bufLen; i++) {
          const w = Math.random() * 2 - 1
          last = (last + 0.02 * w) / 1.02
          d[i] = last * 3.5
        }
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      src.loop = true
      src.connect(soundGain)
      src.start()
      soundNode = src
    } else if (type === 'white') {
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch)
        for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      src.loop = true
      src.connect(soundGain)
      src.start()
      soundNode = src
    } else if (type === 'cafe') {
      // Brown noise with a slight high-freq roll-off (warm café murmur)
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch)
        let last = 0
        for (let i = 0; i < bufLen; i++) {
          const w = Math.random() * 2 - 1
          last = (last + 0.015 * w) / 1.015
          d[i] = last * 4
        }
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      src.loop = true
      const filt = ac.createBiquadFilter()
      filt.type = 'lowshelf'
      filt.frequency.value = 300
      filt.gain.value = 6
      src.connect(filt)
      filt.connect(soundGain)
      src.start()
      soundNode = src
    }
  } catch {}
}

export function stopSoundscape() {
  try { soundNode?.stop() } catch {}
  try { soundNode?.disconnect() } catch {}
  try { soundGain?.disconnect() } catch {}
  soundNode = null
  soundGain = null
}

export function setSoundscapeVolume(vol) {
  if (soundGain) soundGain.gain.value = vol
}
