'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConversationMode } from '@/components/gamification'

export default function ConversePage() {
  const [language, setLanguage] = useState('Spanish')
  const [level, setLevel] = useState('Beginner')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const prefs = localStorage.getItem('speakfast-prefs')
    if (prefs) {
      const p = JSON.parse(prefs)
      if (p.language) setLanguage(p.language)
      if (p.level) setLevel(p.level)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-[var(--text-2)] hover:text-white transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold">AI Conversation Tutor</h1>
        </div>

        {!started ? (
          <div className="glass-liquid rounded-2xl p-8 space-y-6">
            <p className="text-[var(--text-2)]">Chat with Luna, your personal tutor. Get inline corrections as you write.</p>
            <div className="flex gap-3 flex-wrap">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)]"
              >
                {['Spanish', 'French', 'German', 'Italian', 'Japanese', 'Korean', 'Mandarin Chinese', 'Portuguese', 'Hindi', 'Arabic'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)]"
              >
                {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="px-6 py-3 bg-[var(--theme-primary)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Start Conversation →
            </button>
          </div>
        ) : (
          <ConversationMode language={language} level={level} tutorName="Luna" />
        )}
      </div>
    </div>
  )
}
