'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getDailyState, completeDailyChallenge } from '@/lib/gamification/daily-challenge'

interface Question { question: string; options: string[]; answer: number; explanation: string }
interface Challenge { title: string; questions: Question[] }

export default function DailyPage() {
  const [challenge,  setChallenge]  = useState<Challenge | null>(null)
  const [current,    setCurrent]    = useState(0)
  const [selected,   setSelected]   = useState<number | null>(null)
  const [score,      setScore]      = useState(0)
  const [finished,   setFinished]   = useState(false)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    const daily = getDailyState()
    if (daily.completed) { setFinished(true); setScore(daily.score); return }
    const prefs = JSON.parse(localStorage.getItem('speakfast-prefs') ?? '{}')
    if (!prefs.language) return
    const seed = new Date().toISOString().split('T')[0]
    setLoading(true)
    fetch('/api/daily-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: prefs.language, level: prefs.level ?? 'Beginner', seed }),
    })
      .then(r => r.json())
      .then(data => setChallenge(data))
      .finally(() => setLoading(false))
  }, [])

  function pick(idx: number) {
    if (selected !== null) return
    setSelected(idx)
  }

  function next() {
    const q = challenge!.questions[current]
    const correct = selected === q.answer ? 1 : 0
    const newScore = score + correct
    if (current + 1 >= challenge!.questions.length) {
      completeDailyChallenge(newScore)
      setScore(newScore)
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setScore(newScore)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-white animate-pulse">
      Loading challenge...
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-[var(--text-2)] hover:text-white transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
        </div>

        {finished ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{score === 3 ? '🏆' : score >= 2 ? '🎉' : '💪'}</div>
            <p className="text-2xl font-bold">{score}/3 correct</p>
            <p className="text-[var(--text-2)] mt-2">Come back tomorrow for a new challenge!</p>
            <Link href="/" className="mt-6 inline-block px-6 py-3 bg-[var(--theme-primary)] rounded-xl text-sm font-medium">
              Back to Learning
            </Link>
          </div>
        ) : !challenge ? (
          <div className="glass-liquid rounded-2xl p-8 text-center space-y-4">
            <p className="text-[var(--text-2)]">Set your language preferences on the home page first.</p>
            <Link href="/" className="inline-block px-5 py-2 bg-[var(--theme-primary)] rounded-xl text-sm font-medium">
              Go to Home
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex justify-between text-sm text-[var(--text-2)] mb-4">
              <span>Question {current + 1}/3</span>
              <span>{score} correct</span>
            </div>
            <div className="glass-liquid rounded-2xl p-6 mb-4">
              <p className="text-lg font-semibold">{challenge.questions[current].question}</p>
            </div>
            <div className="space-y-3">
              {challenge.questions[current].options.map((opt, i) => {
                const isCorrect = i === challenge.questions[current].answer
                const isSelected = i === selected
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                      selected === null
                        ? 'border-white/10 bg-white/5 hover:bg-white/10'
                        : isCorrect
                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                        : isSelected
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-white/5 bg-white/[0.02] opacity-50'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {selected !== null && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-[var(--text-2)]">{challenge.questions[current].explanation}</p>
                <button onClick={next} className="w-full py-3 bg-[var(--theme-primary)] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  {current + 1 >= challenge.questions.length ? 'Finish' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
