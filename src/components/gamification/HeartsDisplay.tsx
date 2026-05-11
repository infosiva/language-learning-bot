'use client'
import { useEffect, useState } from 'react'
import { getHearts, type HeartsState } from '@/lib/gamification/hearts'

const MAX = 5

export function HeartsDisplay({ className = '' }: { className?: string }) {
  const [state, setState] = useState<HeartsState>({ count: MAX, lastLostAt: null })

  useEffect(() => {
    setState(getHearts())
    const id = setInterval(() => setState(getHearts()), 60_000)
    return () => clearInterval(id)
  }, [])

  const refillMs = 60 * 60 * 1000
  const msLeft = state.lastLostAt
    ? Math.max(0, refillMs - (Date.now() - new Date(state.lastLostAt).getTime()))
    : 0
  const minsLeft = Math.ceil(msLeft / 60_000)

  return (
    <div className={['flex items-center gap-1', className].join(' ')} title={state.count < MAX ? `Next heart in ${minsLeft}m` : 'Full hearts'}>
      {Array.from({ length: MAX }).map((_, i) => (
        <span key={i} className={['text-xl transition-all duration-300', i < state.count ? 'opacity-100' : 'opacity-20 grayscale'].join(' ')}>
          ❤️
        </span>
      ))}
    </div>
  )
}
