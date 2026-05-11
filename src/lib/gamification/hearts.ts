const KEY = 'speakfast-hearts'
const MAX = 5
const REFILL_MS = 60 * 60 * 1000 // 1 hour per heart

export interface HeartsState {
  count: number
  lastLostAt: string | null // ISO string
}

function read(): HeartsState {
  if (typeof window === 'undefined') return { count: MAX, lastLostAt: null }
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? { count: MAX, lastLostAt: null } }
  catch { return { count: MAX, lastLostAt: null } }
}

function write(s: HeartsState) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

/** Returns current hearts after applying time-based refill. */
export function getHearts(): HeartsState {
  const s = read()
  if (s.count >= MAX || !s.lastLostAt) return { count: MAX, lastLostAt: null }
  const elapsed = Date.now() - new Date(s.lastLostAt).getTime()
  const refilled = Math.floor(elapsed / REFILL_MS)
  if (refilled <= 0) return s
  const next: HeartsState = {
    count: Math.min(MAX, s.count + refilled),
    lastLostAt: refilled >= (MAX - s.count) ? null : new Date(new Date(s.lastLostAt).getTime() + refilled * REFILL_MS).toISOString(),
  }
  write(next)
  return next
}

/** Returns new count. Returns false if already 0. */
export function loseHeart(): number | false {
  const s = getHearts()
  if (s.count <= 0) return false
  const next: HeartsState = { count: s.count - 1, lastLostAt: new Date().toISOString() }
  write(next)
  return next.count
}

/** Full refill (e.g. streak freeze or new day). */
export function refillHearts() {
  write({ count: MAX, lastLostAt: null })
}

// ── Streak freeze ──────────────────────────────────────────────
const FREEZE_KEY = 'speakfast-freeze'

export function hasStreakFreeze(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(FREEZE_KEY) === 'active'
}

export function activateStreakFreeze() {
  localStorage.setItem(FREEZE_KEY, 'active')
}

export function consumeStreakFreeze() {
  localStorage.removeItem(FREEZE_KEY)
}
