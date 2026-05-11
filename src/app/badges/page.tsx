'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BADGES, getUnlockedBadges } from '@/lib/gamification/badges'

export default function BadgesPage() {
  const [unlocked, setUnlocked] = useState<string[]>([])
  useEffect(() => { setUnlocked(getUnlockedBadges()) }, [])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-[var(--text-2)] hover:text-white transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold">Badges</h1>
          <span className="ml-auto text-sm text-[var(--text-2)]">{unlocked.length}/{BADGES.length} earned</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map(badge => {
            const earned = unlocked.includes(badge.id)
            return (
              <div key={badge.id} className={`rounded-2xl border p-4 text-center transition-all ${
                earned ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/[0.03] border-white/5 opacity-40'
              }`}>
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-semibold text-sm">{badge.title}</p>
                <p className="text-xs text-[var(--text-2)] mt-1">{badge.description}</p>
                {earned && <p className="text-xs text-yellow-400 mt-2">Earned ✓</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
