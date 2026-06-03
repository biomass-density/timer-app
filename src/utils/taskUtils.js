export function generateId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function parseTaskInput(raw, defaultMinutes = 25) {
  const trimmed = raw.trim()
  // Trailing number = minutes: "Write report 45" → title="Write report", minutes=45
  const match = trimmed.match(/^(.+?)\s+(\d{1,3})\s*$/)
  if (match) {
    const mins = parseInt(match[2], 10)
    if (mins > 0 && mins <= 480) {
      return { title: match[1].trim(), minutes: mins }
    }
  }
  return { title: trimmed, minutes: defaultMinutes }
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

// Full emoji range, grouped into tabs for the picker. `icon` labels each tab.
export const EMOJI_CATEGORIES = [
  { name: 'Popular', icon: '✨', emojis: DEFAULT_EMOJIS },
  { name: 'Smileys', icon: '😀', emojis: [
    '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌',
    '😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸',
    '🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢',
    '😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔',
    '🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤',
    '😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👻','💀',
    '🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  ] },
  { name: 'People', icon: '👋', emojis: [
    '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆',
    '👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅',
    '🤳','💪','🦵','🦶','👂','👃','🧠','🦷','👀','👁️','👅','👄','👶','🧒','👦','👧',
    '🧑','👨','👩','🧓','👴','👵','🙅','🙆','💁','🙋','🙇','🤦','🤷','👮','🕵️','💂',
    '👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙',
    '🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🧍','🧎','💃','🕺','🧖','🧗','🤺',
    '🏇','🏌️','🏄','🚣','🏊','🤽','🚴','🚵','🧘',
  ] },
  { name: 'Animals', icon: '🐶', emojis: [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵',
    '🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗',
    '🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🦗','🕷️','🦂','🐢','🐍','🦎','🦖',
    '🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆',
    '🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏',
    '🐑','🦙','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝',
    '🦦','🦥','🐁','🐀','🐿️','🦔','🐾','🐉','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️',
    '🍀','🍃','🍂','🍁','🍄','🐚','🌾','💐','🌷','🌹','🌺','🌸','🌼','🌻','🌙','⭐',
    '🌟','⚡','🔥','🌈','☀️','⛅','☁️','❄️','⛄','💧','🌊',
  ] },
  { name: 'Food', icon: '🍔', emojis: [
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥',
    '🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯',
    '🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟',
    '🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤',
    '🍙','🍚','🍘','🍥','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭',
    '🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋',
    '🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️',
  ] },
  { name: 'Activity', icon: '⚽', emojis: [
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍',
    '🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿',
    '⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣',
    '🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭',
    '🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️',
    '🎯','🎳','🎮','🎰','🧩',
  ] },
  { name: 'Travel', icon: '✈️', emojis: [
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛴','🚲',
    '🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄',
    '🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁',
    '🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','⛽','🚧','🚦','🚥','🗺️','🗿','🗽','🗼',
    '🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🏕️','⛺',
    '🏠','🏡','🏘️','🏗️','🏭','🏢','🏬','🏥','🏦','🏨','🏪','🏫','💒','🏛️','⛪','🕌',
    '🛕','🕋','⛩️','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉',
  ] },
  { name: 'Objects', icon: '💡', emojis: [
    '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🕹️','💽','💾','💿','📀','📷','📸','📹','🎥',
    '📺','📻','🎙️','⏱️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🧯','💸',
    '💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🧰','🔧','🔨','🛠️','⛏️','🔩','⚙️',
    '🧱','⛓️','🧲','🔫','💣','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🏺','🔮','📿','🧿',
    '💈','🔭','🔬','💊','💉','🩸','🧬','🦠','🧪','🌡️','🧹','🧺','🧻','🚽','🚿','🛁',
    '🧼','🪥','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🧸','🖼️','🛍️','🎁',
    '🎈','🎏','🎀','🪄','🎊','🎉','🏮','🧧','✉️','📩','📨','📧','💌','📦','🏷️','📪',
    '📫','📬','📮','📜','📄','📑','🧾','📊','📈','📉','🗒️','📆','📅','🗑️','📇','🗃️',
    '📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖',
    '🔗','📎','📐','📏','🧮','📌','📍','✂️','🖊️','✒️','🖌️','🖍️','📝','✏️','🔍','🔒',
    '🔓','🔏','🔐','🔑',
  ] },
  { name: 'Symbols', icon: '❤️', emojis: [
    '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖',
    '💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈',
    '♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⚛️','☢️','☣️','✴️','❎','✅',
    '❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🔞','❗','❕','❓','❔','‼️','⁉️',
    '⚠️','🚸','🔱','⚜️','🔰','♻️','✳️','❇️','🌐','💠','🌀','💤','🏧','🚾','♿','🅿️',
    '🚹','🚺','🚼','🚻','🚮','🔣','🔤','🆗','🆙','🆒','🆕','🆓','➕','➖','➗','✖️',
    '♾️','💲','💱','™️','©️','®️','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠',
    '🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🟥','🟧','🟨',
    '🟩','🟦','🟪','⬛','⬜','🟫','🔔','🔕','📣','📢','💬','💭','♠️','♣️','♥️','♦️',
  ] },
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

// Multi-word idioms checked first, where the single-word rule below would misfire
// (e.g. "grocery run" is shopping, not exercise). Matched on whole words.
const EMOJI_PHRASES = [
  [['grocery run', 'grocery shop', 'grocery store', 'food shop', 'food run'], '🛒'],
  [['coffee run'], '☕'],
  [['beer run', 'wine run', 'liquor run'], '🍷'],
  [['deep work', 'focus session', 'deep focus', 'focus block'], '🎯'],
  [['meal prep'], '🍳'],
  [['stand up', 'stand-up', 'standup meeting'], '📅'],
  [['one on one', 'one-on-one', '1 on 1', '1:1'], '🤝'],
]

// Base word → emoji. getAutoEmoji also tries simple plural / -ing / -ed variants,
// so "meetings", "running", "emailed" resolve to their base word. Keep generic
// filler nouns (kitchen, house, stuff…) OUT so the meaningful verb wins instead.
const EMOJI_WORDS = {
  // work & productivity
  work: '💼', job: '💼', office: '🏢', boss: '💼', career: '💼',
  task: '📋', todo: '📋', checklist: '📋', project: '📊', deadline: '⏰',
  goal: '🎯', target: '🎯', priority: '⭐', milestone: '🏁',
  plan: '🗺️', planning: '🗺️', strategy: '🧭', roadmap: '🗺️', agenda: '📋',
  meeting: '📅', meet: '📅', standup: '📅', sync: '🔄', retro: '📅',
  sprint: '🏁', kickoff: '🏁', review: '🔍', feedback: '💬', audit: '🔍',
  report: '📊', summary: '📝', recap: '📝',
  email: '📧', inbox: '📧', mail: '📧', reply: '📧', message: '💬',
  dm: '💬', slack: '💬', call: '📞', phone: '📞', zoom: '📹',
  interview: '🤝', onboarding: '🤝', presentation: '🎤', slides: '📊',
  deck: '📊', pitch: '🎤', demo: '🖥️', proposal: '📄', document: '📄',
  doc: '📄', paperwork: '📑', contract: '📜', note: '📝', notes: '📝',
  admin: '🗂️', organize: '🗂️', research: '🔬', analysis: '📈',
  analyze: '📈', data: '📊', metrics: '📈', stats: '📈', spreadsheet: '📊',

  // coding & tech
  code: '💻', coding: '💻', program: '💻', programming: '💻', dev: '💻',
  develop: '💻', debug: '🐛', bug: '🐛', fix: '🔧', deploy: '🚀',
  ship: '🚀', release: '🚀', launch: '🚀', build: '🛠️', test: '🧪',
  refactor: '🔧', api: '🔌', database: '🗄️', server: '🖥️', git: '🔀',
  merge: '🔀', commit: '💾', pr: '🔍', ticket: '🎫', script: '💻',
  computer: '💻', laptop: '💻', software: '💻', app: '📱', website: '🌐',
  web: '🌐', config: '⚙️', setup: '🛠️', install: '⚙️',

  // writing & creative
  write: '✍️', writing: '✍️', blog: '✍️', article: '📰', essay: '📝',
  draft: '📝', edit: '✏️', proofread: '🔍', journal: '📔', newsletter: '📰',
  copy: '✍️', story: '📖', design: '🎨', sketch: '✏️', draw: '🎨',
  paint: '🎨', illustrate: '🎨', art: '🎨', logo: '🎨', figma: '🎨',
  mockup: '🎨', wireframe: '📐', prototype: '🧩', ui: '🎨', ux: '🎨',
  branding: '🎨', photo: '📷', photography: '📷', camera: '📷', video: '🎥',
  film: '🎬', movie: '🎬', record: '🎙️', podcast: '🎙️', music: '🎵',
  song: '🎵', guitar: '🎸', piano: '🎹', sing: '🎤', instrument: '🎵',

  // learning
  read: '📚', reading: '📚', book: '📚', study: '📖', studying: '📖',
  learn: '🎓', course: '🎓', class: '🎓', lecture: '🎓', homework: '✏️',
  assignment: '✏️', exam: '📝', quiz: '📝', revise: '📖', flashcards: '🃏',
  language: '🗣️', school: '🏫', college: '🎓', university: '🎓',
  lesson: '📖', tutorial: '🎓',

  // fitness & movement
  run: '🏃', running: '🏃', jog: '🏃', jogging: '🏃', gym: '🏋️',
  workout: '🏋️', exercise: '💪', lift: '🏋️', weights: '🏋️',
  training: '🏋️', yoga: '🧘', pilates: '🧘', stretch: '🤸', cardio: '🏃',
  walk: '🚶', walking: '🚶', stroll: '🚶', swim: '🏊', swimming: '🏊',
  bike: '🚴', biking: '🚴', cycle: '🚴', cycling: '🚴', hike: '🥾',
  hiking: '🥾', climb: '🧗', climbing: '🧗', dance: '💃', sport: '⚽',
  soccer: '⚽', basketball: '🏀', tennis: '🎾', golf: '⛳', boxing: '🥊',
  marathon: '🏃',

  // health & medical
  doctor: '🩺', dentist: '🦷', dental: '🦷', appointment: '📅',
  checkup: '🩺', medicine: '💊', meds: '💊', pill: '💊', vitamins: '💊',
  prescription: '💊', therapy: '🛋️', therapist: '🛋️', vaccine: '💉',
  shot: '💉', hospital: '🏥', health: '🩺', mental: '🧠', wellness: '🧘',

  // rest & self-care
  break: '☕', rest: '😌', relax: '😌', chill: '🛋️', nap: '😴',
  sleep: '😴', meditate: '🧘', meditation: '🧘', breathe: '🫁',
  shower: '🚿', bath: '🛁', skincare: '🧴', selfcare: '💆', spa: '💆',
  haircut: '💇', hair: '💇', nails: '💅', manicure: '💅', massage: '💆',

  // chores & home
  clean: '🧹', cleaning: '🧹', tidy: '🧹', vacuum: '🧹', mop: '🧽',
  dust: '🧹', sweep: '🧹', laundry: '🧺', wash: '🧺', dishes: '🍽️',
  trash: '🗑️', garbage: '🗑️', recycle: '♻️', declutter: '📦',
  chores: '🧹', repair: '🔧', diy: '🛠️', assemble: '🛠️', garden: '🪴',
  gardening: '🪴', plant: '🪴', plants: '🪴', flowers: '🌷', weed: '🪴',
  mow: '🌱', lawn: '🌱', water: '💧', compost: '🪴', iron: '👔', fold: '🧺',

  // cooking & food
  cook: '🍳', cooking: '🍳', bake: '🍰', baking: '🍰', recipe: '🍳',
  grill: '🍖', meal: '🍽️', breakfast: '🍳', lunch: '🥪', dinner: '🍽️',
  brunch: '🥐', snack: '🍎', eat: '🍽️', food: '🍽️', coffee: '☕',
  tea: '🍵', drink: '🥤', smoothie: '🥤', groceries: '🛒', grocery: '🛒',

  // shopping & errands
  shop: '🛍️', shopping: '🛍️', buy: '🛒', purchase: '🛒', order: '📦',
  errand: '🏃', errands: '🏃', pickup: '📦', delivery: '📦', package: '📦',
  mall: '🛍️', store: '🏬',

  // money & finance
  pay: '💳', payment: '💳', bill: '🧾', bills: '🧾', rent: '🏠',
  mortgage: '🏦', bank: '🏦', banking: '🏦', finance: '💰', finances: '💰',
  money: '💰', save: '💰', savings: '💰', invest: '📈', stocks: '📈',
  crypto: '🪙', tax: '🧾', taxes: '🧾', accounting: '🧮', expenses: '💳',
  insurance: '🛡️', salary: '💵', paycheck: '💵', budget: '💰',

  // social, family & events
  family: '👪', kids: '🧒', kid: '🧒', baby: '👶', parents: '👪',
  friend: '🤝', friends: '🫂', party: '🎉', birthday: '🎂',
  anniversary: '💐', wedding: '💒', date: '💕', gift: '🎁', present: '🎁',
  visit: '🤝', hangout: '🫂', celebrate: '🎉', reunion: '🫂', text: '💬',
  mom: '📞', dad: '📞',

  // pets
  pet: '🐾', pets: '🐾', dog: '🐕', cat: '🐈', vet: '🩺', feed: '🍖',

  // travel & transport
  travel: '✈️', flight: '✈️', fly: '✈️', trip: '🧳', vacation: '🏖️',
  holiday: '🏖️', pack: '🧳', packing: '🧳', hotel: '🏨', drive: '🚗',
  driving: '🚗', car: '🚗', gas: '⛽', fuel: '⛽', commute: '🚆',
  train: '🚆', bus: '🚌', subway: '🚇', airport: '🛫', passport: '🛂',
  visa: '🛂', taxi: '🚕', parking: '🅿️',

  // social media & content
  social: '📱', twitter: '🐦', tweet: '🐦', instagram: '📷', insta: '📷',
  linkedin: '💼', tiktok: '🎵', youtube: '📺', post: '📱', content: '📱',
  news: '📰', stream: '📺',

  // entertainment & leisure
  game: '🎮', games: '🎮', gaming: '🎮', play: '🎮', tv: '📺',
  watch: '📺', netflix: '📺', show: '📺', concert: '🎫', festival: '🎪',
  museum: '🖼️', hobby: '🎨', puzzle: '🧩', chess: '♟️', cards: '🃏',

  // misc
  idea: '💡', ideas: '💡', brainstorm: '💡', think: '💭', remember: '📌',
  remind: '⏰', reminder: '⏰', schedule: '📅', calendar: '📅',
  backup: '💾', update: '🔄', focus: '🎯',
}

// Candidate base forms for a word, so plural / -ing / -ed variants match the
// dictionary. Over-stemmed forms (e.g. "runn") simply won't be found, so they
// can't cause a wrong match — irregular gerunds like "running" are listed above.
function wordVariants(w) {
  const v = [w]
  if (w.length > 4 && w.endsWith('ies')) v.push(w.slice(0, -3) + 'y')
  if (w.length > 3 && w.endsWith('es'))  v.push(w.slice(0, -2))
  if (w.length > 3 && w.endsWith('s'))   v.push(w.slice(0, -1))
  if (w.length > 4 && w.endsWith('ing')) v.push(w.slice(0, -3), w.slice(0, -3) + 'e')
  if (w.length > 4 && w.endsWith('ed'))  v.push(w.slice(0, -2), w.slice(0, -1))
  return v
}

export function getAutoEmoji(title) {
  const lower = title.toLowerCase()

  // 1. Multi-word idioms (matched on word boundaries to avoid e.g. "understand")
  const padded = ` ${lower} `
  for (const [phrases, emoji] of EMOJI_PHRASES) {
    if (phrases.some(p => padded.includes(` ${p} `))) return emoji
  }

  // 2. Keyword dictionary — rightmost matching word wins (task titles read
  //    "verb + object", and the object is usually the more meaningful icon).
  const words = lower.match(/[a-z]+/g) || []
  let match = null
  for (const w of words) {
    for (const cand of wordVariants(w)) {
      if (EMOJI_WORDS[cand]) { match = EMOJI_WORDS[cand]; break }
    }
  }
  return match || '✨'
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
