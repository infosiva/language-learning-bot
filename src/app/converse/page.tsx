'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConversationMode } from '@/components/gamification'

const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Japanese', 'Korean', 'Mandarin Chinese', 'Portuguese', 'Hindi', 'Arabic']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function ConversePage() {
  const [language, setLanguage] = useState('Spanish')
  const [level, setLevel] = useState('Beginner')
  const [key, setKey] = useState(0) // remount ConversationMode on language/level change

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const footer = document.getElementById('layout-footer')
    if (footer) footer.style.display = 'none'
    return () => {
      document.body.style.overflow = ''
      const f = document.getElementById('layout-footer')
      if (f) f.style.display = ''
    }
  }, [])

  useEffect(() => {
    const prefs = localStorage.getItem('speakfast-prefs')
    if (prefs) {
      const p = JSON.parse(prefs)
      if (p.language) setLanguage(p.language)
      if (p.level) setLevel(p.level)
    }
  }, [])

  function changeLanguage(lang: string) {
    setLanguage(lang)
    setKey(k => k + 1)
  }

  function changeLevel(lvl: string) {
    setLevel(lvl)
    setKey(k => k + 1)
  }

  return (
    <div className="flex flex-col text-[var(--foreground)] overflow-hidden" style={{ position: 'fixed', top: '4rem', left: 0, right: 0, bottom: 0 }}>
      {/* Compact top bar — always visible, never shrinks */}
      <div className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md shrink-0">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm shrink-0">← Back</Link>
          <h1 className="font-bold text-sm sm:text-base truncate">AI Conversation</h1>
          <div className="ml-auto flex gap-1.5 shrink-0">
            <select
              value={language}
              onChange={e => changeLanguage(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-[var(--theme-primary)] cursor-pointer max-w-[110px] sm:max-w-none"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={level}
              onChange={e => changeLevel(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-[var(--theme-primary)] cursor-pointer"
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chat — fills remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 h-full flex flex-col py-3">
          <ConversationMode key={key} language={language} level={level} tutorName="Luna" className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  )
}
