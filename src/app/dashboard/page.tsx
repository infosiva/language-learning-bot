'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BADGES, getUnlockedBadges } from '@/lib/gamification/badges'

interface StreakData { streak: number; lastDate: string }
interface Flashcard { word: string; translation: string; language: string; example?: string; addedAt: string }

function StatCard({ label, value, sub, icon, accent = 'violet' }: {
  label: string; value: string | number; sub?: string; icon: string; accent?: string
}) {
  const colors: Record<string, string> = {
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20',
    pink: 'from-pink-500/10 to-pink-600/5 border-pink-500/20',
  }
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[accent] ?? colors.violet}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-black text-white leading-none">{value}</div>
      <div className="text-sm text-white/50 mt-1">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
    </div>
  )
}

function MiniBar({ label, value, max, color = '#7c3aed' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-white/50 truncate shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs text-white/40 w-6 text-right shrink-0">{value}</div>
    </div>
  )
}

// 7-day activity dots
function WeekGrid({ streakData }: { streakData: StreakData }) {
  const days: { date: string; label: string; active: boolean }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    days.push({
      date: iso,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      active: streakData.lastDate === iso || (i === 0 && streakData.streak > 0),
    })
  }
  return (
    <div className="flex gap-2 items-end">
      {days.map(d => (
        <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
          <div className={`w-full rounded-md transition-all ${d.active ? 'h-8 bg-violet-500 shadow-sm shadow-violet-500/40' : 'h-4 bg-white/[0.06]'}`} />
          <span className="text-[9px] text-white/20">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [streak, setStreak] = useState<StreakData>({ streak: 0, lastDate: '' })
  const [cards, setCards] = useState<Flashcard[]>([])
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [isPro, setIsPro] = useState(false)
  const [prefs, setPrefs] = useState<{ language: string; level: string }>({ language: 'Spanish', level: 'Beginner' })

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('speakfast-streak') || '{"streak":0,"lastDate":""}')
      setStreak(s)
    } catch { /* empty */ }

    try {
      const c = JSON.parse(localStorage.getItem('speakfast-cards') || '[]')
      setCards(c)
    } catch { /* empty */ }

    setUnlockedBadges(getUnlockedBadges())
    setIsPro(localStorage.getItem('speakiq-pro') === '1')

    try {
      const p = JSON.parse(localStorage.getItem('speakfast-prefs') || '{}')
      if (p.language) setPrefs(p)
    } catch { /* empty */ }
  }, [])

  // Language breakdown from flashcards
  const langCount: Record<string, number> = {}
  for (const c of cards) {
    langCount[c.language] = (langCount[c.language] ?? 0) + 1
  }
  const langEntries = Object.entries(langCount).sort((a, b) => b[1] - a[1])
  const maxLang = langEntries[0]?.[1] ?? 1

  const todayActive = streak.lastDate === new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen text-white pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">My Dashboard</h1>
            <p className="text-sm text-white/40 mt-1">Your learning progress at a glance</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/"
              className="px-4 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold hover:bg-violet-500/20 transition-all">
              Continue learning →
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="🔥" label="Day streak" value={streak.streak} sub={todayActive ? 'Active today' : 'Keep it going!'} accent="orange" />
          <StatCard icon="📇" label="Words saved" value={cards.length} sub={`${langEntries.length} language${langEntries.length !== 1 ? 's' : ''}`} accent="violet" />
          <StatCard icon="🏅" label="Badges" value={unlockedBadges.length} sub={`of ${BADGES.length} total`} accent="green" />
          <StatCard icon={isPro ? '⚡' : '🆓'} label="Plan" value={isPro ? 'Pro' : 'Free'} sub={isPro ? 'Unlimited' : '20 msg/day'} accent={isPro ? 'cyan' : 'pink'} />
        </div>

        {/* 2-col grid: streak + language breakdown */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">

          {/* 7-day activity */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70">7-Day Activity</h2>
              <span className="text-xs text-white/30">{streak.streak} day streak</span>
            </div>
            <WeekGrid streakData={streak} />
            <p className="text-xs text-white/25 mt-3">
              {todayActive ? '✓ Practiced today — keep the streak alive!' : 'No practice yet today — start a conversation!'}
            </p>
          </div>

          {/* Language breakdown */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70">Words by Language</h2>
              <span className="text-xs text-white/30">{cards.length} total</span>
            </div>
            {langEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <span className="text-2xl">📭</span>
                <p className="text-xs text-white/30">No words saved yet — start a vocabulary session</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {langEntries.slice(0, 6).map(([lang, count]) => (
                  <MiniBar key={lang} label={lang} value={count} max={maxLang} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current session + badges */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">

          {/* Current setup */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">Current Setup</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Language</span>
                <span className="text-sm font-semibold text-white/80">{prefs.language}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Level</span>
                <span className="text-sm font-semibold text-white/80">{prefs.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Plan</span>
                <span className={`text-sm font-semibold ${isPro ? 'text-cyan-400' : 'text-white/50'}`}>{isPro ? 'Pro ⚡' : 'Free'}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <Link href="/"
                className="block w-full py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition-all">
                Continue {prefs.language} →
              </Link>
            </div>
          </div>

          {/* Recent badges */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70">Badges</h2>
              <Link href="/badges" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
            </div>
            {unlockedBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <span className="text-2xl">🎖️</span>
                <p className="text-xs text-white/30 text-center">Complete lessons to earn your first badge</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {BADGES.filter(b => unlockedBadges.includes(b.id)).slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.07]">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-xs text-yellow-200/70 font-medium">{b.title}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                <div className="bg-yellow-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${BADGES.length > 0 ? (unlockedBadges.length / BADGES.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-white/20 mt-1">{unlockedBadges.length} / {BADGES.length} earned</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { href: '/', icon: '💬', label: 'Practice', sub: 'Start a session' },
              { href: '/wordbank', icon: '📖', label: 'Word Bank', sub: `${cards.length} words` },
              { href: '/badges', icon: '🏅', label: 'Badges', sub: `${unlockedBadges.length} earned` },
              { href: '/path', icon: '🗺️', label: 'My Path', sub: 'Learning roadmap' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/20 transition-all text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-xs font-semibold text-white/70">{item.label}</span>
                <span className="text-[10px] text-white/30">{item.sub}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upgrade CTA — free users only */}
        {!isPro && (
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-600/5 p-6 text-center">
            <p className="text-sm font-semibold text-white/70 mb-1">Unlock unlimited practice</p>
            <p className="text-xs text-white/40 mb-4">Pro removes the daily limit and adds grammar reports + priority AI speed</p>
            <Link href="/?upgrade=true"
              className="inline-block px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all">
              Upgrade to Pro — $7/mo
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
