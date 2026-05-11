const KEY = 'speakfast-badges'

export interface Badge {
  id: string
  title: string
  description: string
  icon: string
  check: (stats: UserStats) => boolean
}

export interface UserStats {
  streak: number
  lessonsCompleted: number
  wordsLearned: number
  xp: number
  conversationTurns: number
}

export const BADGES: Badge[] = [
  { id: 'streak-7',     title: 'Week Warrior',      icon: '🔥', description: '7-day streak',        check: s => s.streak >= 7 },
  { id: 'streak-30',    title: 'Monthly Master',    icon: '🌟', description: '30-day streak',       check: s => s.streak >= 30 },
  { id: 'streak-100',   title: 'Century Club',      icon: '💯', description: '100-day streak',      check: s => s.streak >= 100 },
  { id: 'lessons-10',   title: 'Eager Learner',     icon: '📚', description: '10 lessons done',     check: s => s.lessonsCompleted >= 10 },
  { id: 'lessons-50',   title: 'Scholar',           icon: '🎓', description: '50 lessons done',     check: s => s.lessonsCompleted >= 50 },
  { id: 'lessons-100',  title: 'Linguist',          icon: '🏆', description: '100 lessons done',    check: s => s.lessonsCompleted >= 100 },
  { id: 'words-100',    title: 'Vocabulary Builder', icon: '📖', description: '100 words learned',   check: s => s.wordsLearned >= 100 },
  { id: 'xp-500',       title: 'XP Hunter',         icon: '⚡', description: '500 XP earned',       check: s => s.xp >= 500 },
  { id: 'chat-first',   title: 'Conversationalist',  icon: '💬', description: 'First AI chat',       check: s => s.conversationTurns >= 1 },
]

export function getUnlockedBadges(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function checkAndUnlockBadges(stats: UserStats): Badge[] {
  const unlocked = getUnlockedBadges()
  const newlyUnlocked: Badge[] = []
  for (const badge of BADGES) {
    if (!unlocked.includes(badge.id) && badge.check(stats)) {
      unlocked.push(badge.id)
      newlyUnlocked.push(badge)
    }
  }
  localStorage.setItem(KEY, JSON.stringify(unlocked))
  return newlyUnlocked
}
