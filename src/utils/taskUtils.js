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
  red:    { bg: '#FF6B6B', light: '#FFF0F0', chip: '#FFD6D6', label: 'Red' },
  orange: { bg: '#FF9F43', light: '#FFF5E8', chip: '#FFE0BB', label: 'Orange' },
  yellow: { bg: '#F5CB5C', light: '#FFFBE8', chip: '#FCEDB0', label: 'Yellow' },
  green:  { bg: '#51CF66', light: '#EDFAF0', chip: '#B8F0C1', label: 'Green' },
  teal:   { bg: '#20C997', light: '#E5FAF4', chip: '#9FEEDB', label: 'Teal' },
  blue:   { bg: '#4DA6FF', light: '#E5F2FF', chip: '#B3D6FF', label: 'Blue' },
  purple: { bg: '#9B6FD4', light: '#F0E8FF', chip: '#D4BAFF', label: 'Purple' },
  pink:   { bg: '#F06595', light: '#FFE5EF', chip: '#FFB8D0', label: 'Pink' },
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
