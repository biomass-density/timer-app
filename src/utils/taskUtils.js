export function generateId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function parseTaskInput(raw) {
  const trimmed = raw.trim()
  // Trailing number = minutes: "Write report 45" → title="Write report", minutes=45
  const match = trimmed.match(/^(.+?)\s+(\d{1,3})\s*$/)
  if (match) {
    const mins = parseInt(match[2], 10)
    if (mins > 0 && mins <= 480) {
      return { title: match[1].trim(), minutes: mins }
    }
  }
  return { title: trimmed, minutes: 25 }
}

export const TASK_COLORS = {
  red:    { bg: '#FF6B6B', text: '#fff',     text2: 'rgba(255,255,255,0.7)', btnBg: 'rgba(255,255,255,0.22)', light: '#FFF0F0', chip: '#FFD6D6', label: 'Red' },
  orange: { bg: '#FF9F43', text: '#fff',     text2: 'rgba(255,255,255,0.7)', btnBg: 'rgba(255,255,255,0.22)', light: '#FFF5E8', chip: '#FFE0BB', label: 'Orange' },
  yellow: { bg: '#F5CB5C', text: '#2A1D00',  text2: 'rgba(42,29,0,0.58)',   btnBg: 'rgba(0,0,0,0.10)',       light: '#FFFBE8', chip: '#FCEDB0', label: 'Yellow' },
  green:  { bg: '#51CF66', text: '#0d2a14',  text2: 'rgba(13,42,20,0.62)',  btnBg: 'rgba(0,0,0,0.10)',       light: '#EDFAF0', chip: '#B8F0C1', label: 'Green' },
  teal:   { bg: '#20C997', text: '#082820',  text2: 'rgba(8,40,32,0.62)',   btnBg: 'rgba(0,0,0,0.10)',       light: '#E5FAF4', chip: '#9FEEDB', label: 'Teal' },
  blue:   { bg: '#4DA6FF', text: '#fff',     text2: 'rgba(255,255,255,0.7)', btnBg: 'rgba(255,255,255,0.22)', light: '#E5F2FF', chip: '#B3D6FF', label: 'Blue' },
  purple: { bg: '#9B6FD4', text: '#fff',     text2: 'rgba(255,255,255,0.7)', btnBg: 'rgba(255,255,255,0.22)', light: '#F0E8FF', chip: '#D4BAFF', label: 'Purple' },
  pink:   { bg: '#F06595', text: '#fff',     text2: 'rgba(255,255,255,0.7)', btnBg: 'rgba(255,255,255,0.22)', light: '#FFE5EF', chip: '#FFB8D0', label: 'Pink' },
}

export const COLOR_KEYS = Object.keys(TASK_COLORS)

export const DEFAULT_EMOJIS = [
  '✨','📝','💡','🎯','🔥','💪','🌟','📚','🎨','🏃',
  '🧘','💻','📱','🎵','🍎','☕','📧','🧹','🛒','💰',
  '🌱','🎮','📞','🔧','📊','🎤','🏋️','🧠','🎬','🌈',
  '🦋','🐝','🚀','⭐','🌸','🍕','🎪','🏆','🎁','💎',
]

export function getNextColor(tasks) {
  const used = tasks.map(t => t.color)
  const colors = COLOR_KEYS
  // Pick least-used color
  const counts = Object.fromEntries(colors.map(c => [c, 0]))
  used.forEach(c => { if (counts[c] !== undefined) counts[c]++ })
  return colors.reduce((a, b) => counts[a] <= counts[b] ? a : b)
}

export function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })
}

const EMOJI_RULES = [
  { keys: ['email', 'inbox', 'reply', 'message', 'mail'], emoji: '📧' },
  { keys: ['meeting', 'standup', 'sync', 'retro', 'sprint'], emoji: '📅' },
  { keys: ['call', 'zoom', 'phone', 'ring', 'video'], emoji: '📞' },
  { keys: ['lunch', 'dinner', 'breakfast', 'eat', 'food', 'meal', 'snack', 'coffee', 'tea'], emoji: '🍽️' },
  { keys: ['run', 'running', 'jog', 'exercise', 'gym', 'workout', 'walk', 'yoga', 'stretch', 'hike'], emoji: '🏃' },
  { keys: ['write', 'writing', 'blog', 'report', 'essay', 'draft', 'article', 'newsletter'], emoji: '✍️' },
  { keys: ['code', 'coding', 'dev', 'develop', 'debug', 'build', 'deploy', 'script'], emoji: '💻' },
  { keys: ['read', 'reading', 'book', 'study', 'studying', 'learn', 'research', 'docs'], emoji: '📚' },
  { keys: ['review', 'pr', 'feedback', 'check', 'qa', 'test', 'audit'], emoji: '🔍' },
  { keys: ['design', 'figma', 'ui', 'ux', 'sketch', 'mockup', 'prototype', 'wireframe'], emoji: '🎨' },
  { keys: ['plan', 'planning', 'strategy', 'goals', 'roadmap', 'agenda'], emoji: '🗺️' },
  { keys: ['music', 'guitar', 'piano', 'sing', 'practice', 'instrument', 'record'], emoji: '🎵' },
  { keys: ['shop', 'shopping', 'groceries', 'buy', 'order', 'purchase'], emoji: '🛒' },
  { keys: ['clean', 'cleaning', 'laundry', 'dishes', 'vacuum', 'tidy', 'organise', 'organize'], emoji: '🧹' },
  { keys: ['social', 'twitter', 'instagram', 'linkedin', 'post', 'content', 'media'], emoji: '📱' },
  { keys: ['data', 'analyse', 'analyze', 'analytics', 'metrics', 'stats', 'report'], emoji: '📊' },
  { keys: ['break', 'relax', 'rest', 'pause', 'chill', 'nap', 'walk'], emoji: '☕' },
  { keys: ['finance', 'budget', 'invoice', 'payment', 'accounting', 'tax', 'billing'], emoji: '💰' },
  { keys: ['present', 'presentation', 'slides', 'pitch', 'demo', 'talk'], emoji: '🎤' },
  { keys: ['travel', 'flight', 'pack', 'trip', 'commute'], emoji: '✈️' },
]

export function getAutoEmoji(title) {
  const lower = title.toLowerCase()
  for (const rule of EMOJI_RULES) {
    if (rule.keys.some(k => lower.includes(k))) return rule.emoji
  }
  return '✨'
}

const PALETTES = [
  ['purple', 'teal', 'orange', 'pink', 'blue', 'green', 'red', 'yellow'],
  ['blue', 'pink', 'green', 'orange', 'teal', 'purple', 'yellow', 'red'],
  ['teal', 'purple', 'red', 'blue', 'orange', 'pink', 'green', 'yellow'],
  ['orange', 'blue', 'pink', 'teal', 'red', 'green', 'purple', 'yellow'],
]

export function getAestheticPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)]
}

// ── Emoji themes ──────────────────────────────────────────────────────────────
export const EMOJI_THEMES = [
  { id: 'auto',      name: 'Match tasks!',        preview: '🔍', emojis: null },
  { id: 'random',    name: 'Surprise Me',          preview: '🎲', emojis: null },
  { id: 'summer',    name: 'Summer',               preview: '☀️', emojis: ['☀️','🌊','🏖️','🌴','🍦','🕶️','🌻','🏄','🍹','🐚','🦀','🌞','👒','🎪','🌅'] },
  { id: 'fall',      name: 'Fall/Autumn',          preview: '🍂', emojis: ['🍂','🍁','🎃','🌾','🦔','☕','🍄','🌰','🍎','🦃','🪔','🌽','🍵','🎑','🍠'] },
  { id: 'winter',    name: 'Winter',               preview: '❄️', emojis: ['❄️','⛄','🌨️','🎿','🧣','☃️','🏔️','🫖','🧤','🦌','🎅','🔔','🕯️','🧊','⛷️'] },
  { id: 'spring',    name: 'Spring',               preview: '🌸', emojis: ['🌸','🌷','🦋','🌿','🐣','🌼','🐝','🌱','🦜','🌺','🐞','🌈','🐸','🍓','🪻'] },
  { id: 'celebrate', name: "Let's Celebrate!",     preview: '🎉', emojis: ['🎉','🎊','🥳','🎈','✨','🎁','🍾','🥂','🎆','🎇','🎀','🏆','🌟','💃','🎶'] },
  { id: 'sweet',     name: 'Sweet Tooth',          preview: '🍰', emojis: ['🍰','🧁','🍭','🍬','🍫','🍩','🍪','🎂','🍮','🍡','🍦','🧋','🍨','🫙','🍯'] },
  { id: 'nature',    name: 'Touch Grass',          preview: '🌿', emojis: ['🌿','🍃','🌲','🌳','🦋','🐛','🌸','🍀','🌾','🐸','🌻','🐢','🦎','🍄','🪨'] },
  { id: 'fantasy',   name: 'Once Upon a Time',     preview: '🏰', emojis: ['🏰','🐉','🧙','⚔️','🔮','🦄','📜','🧝','👑','🪄','🗡️','🛡️','🧞','🧜','🔱'] },
  { id: 'animals',   name: 'The Zoo',              preview: '🦁', emojis: ['🦁','🐘','🦒','🐧','🦊','🐼','🦓','🦏','🐨','🦍','🐅','🦭','🦛','🦩','🦚'] },
  { id: 'fruit',     name: 'Fruit Salad',          preview: '🍓', emojis: ['🍓','🍇','🍊','🍋','🍑','🥭','🍍','🥝','🍒','🍌','🍎','🍉','🍈','🫐','🍐'] },
  { id: 'circles',   name: 'Rainbow Circles',      preview: '🔵', emojis: ['🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪','🔶','🔷','🔸','🔹','🟥','🟦'] },
  { id: 'snacks',    name: 'Wholesome Snacks',     preview: '🧀', emojis: ['🧀','🥪','🥨','🍿','🥐','🧇','🥞','🍱','🥙','🫔','🥗','🥫','🍘','🧃','🫙'] },
  { id: 'zombie',    name: 'Zombie Apocalypse',    preview: '🧟', emojis: ['🧟','💀','🪦','🔪','☢️','🦷','🏚️','🧠','👁️','⚰️','🩸','🔦','🪓','🕷️','☠️'] },
]

export function applyEmojiTheme(tasks, themeId) {
  if (themeId === 'auto') return tasks.map(t => ({ ...t, emoji: getAutoEmoji(t.title) }))
  if (themeId === 'random') {
    const pool = EMOJI_THEMES.flatMap(t => t.emojis ?? [])
    return tasks.map(t => ({ ...t, emoji: pool[Math.floor(Math.random() * pool.length)] }))
  }
  const theme = EMOJI_THEMES.find(t => t.id === themeId)
  if (!theme?.emojis) return tasks
  return tasks.map((t, i) => ({ ...t, emoji: theme.emojis[i % theme.emojis.length] }))
}

// ── Color themes ──────────────────────────────────────────────────────────────
export const COLOR_THEMES = [
  { id: 'rainbow',    name: 'Rainbow Bliss',       colors: ['red','orange','yellow','green','teal','blue','purple','pink'] },
  { id: 'ocean',      name: 'Ocean Mist',          colors: ['blue','teal','blue','teal','blue','teal','blue','teal'] },
  { id: 'grape',      name: 'Crunchy Grape',       colors: ['purple','purple','pink','purple','purple','pink','purple','purple'] },
  { id: 'leaves',     name: 'Rustling Leaves',     colors: ['orange','red','yellow','orange','red','orange','yellow','orange'] },
  { id: 'lavender',   name: 'Lavender Cupcakes',   colors: ['purple','pink','purple','pink','purple','pink','purple','pink'] },
  { id: 'skies',      name: 'Clear Skies',         colors: ['blue','blue','teal','blue','blue','teal','blue','blue'] },
  { id: 'passion',    name: 'Passionfruit Delight',colors: ['pink','red','pink','purple','pink','red','pink','purple'] },
  { id: 'yam',        name: 'Bubble Yam',          colors: ['purple','orange','purple','orange','purple','orange','purple','orange'] },
  { id: 'tangerine',  name: 'Tangerine Twist',     colors: ['orange','yellow','orange','orange','yellow','orange','yellow','orange'] },
  { id: 'jungle',     name: 'Jungle Fever',        colors: ['green','teal','green','green','teal','green','teal','green'] },
  { id: 'cornfield',  name: 'Cornfield Breeze',    colors: ['yellow','green','yellow','green','yellow','green','yellow','green'] },
  { id: 'watermelon', name: 'Watermelon Pop',      colors: ['red','green','red','green','red','green','red','green'] },
  { id: 'vibrant',    name: 'Vibrant Day',         colors: ['orange','yellow','green','teal','blue','purple','pink','red'] },
  { id: 'surprise',   name: '✨ Surprise Me',      colors: null },
  { id: 'none',       name: '✕ Reset colors',     colors: null },
]

export function applyColorTheme(tasks, themeId) {
  if (themeId === 'none') return tasks.map((t, i) => ({ ...t, color: COLOR_KEYS[i % COLOR_KEYS.length] }))
  if (themeId === 'surprise') {
    const palette = getAestheticPalette()
    return tasks.map((t, i) => ({ ...t, color: palette[i % palette.length] }))
  }
  const theme = COLOR_THEMES.find(t => t.id === themeId)
  if (!theme?.colors) return tasks
  return tasks.map((t, i) => ({ ...t, color: theme.colors[i % theme.colors.length] }))
}
