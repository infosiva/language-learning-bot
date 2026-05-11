const KEY = 'speakfast-daily'

export interface DailyState {
  date: string          // YYYY-MM-DD
  completed: boolean
  score: number         // 0-3
}

export function getDailyState(): DailyState {
  const today = new Date().toISOString().split('T')[0]
  if (typeof window === 'undefined') return { date: today, completed: false, score: 0 }
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (s?.date === today) return s
  } catch { /* ignore */ }
  return { date: today, completed: false, score: 0 }
}

export function completeDailyChallenge(score: number) {
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem(KEY, JSON.stringify({ date: today, completed: true, score }))
}
