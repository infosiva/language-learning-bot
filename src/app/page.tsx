'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

function useRateLimit(key: string, limit: number) {
  const getUsage = useCallback(() => {
    if (typeof window === 'undefined') return { count: 0, date: '' }
    try { return JSON.parse(localStorage.getItem(key) || '{"count":0,"date":""}') } catch { return { count: 0, date: '' } }
  }, [key])
  const today = new Date().toISOString().split('T')[0]
  const usage = getUsage()
  const count = usage.date === today ? usage.count : 0
  const remaining = Math.max(0, limit - count)
  const increment = useCallback(() => {
    const d = new Date().toISOString().split('T')[0]
    const u = getUsage()
    const c = u.date === d ? u.count + 1 : 1
    localStorage.setItem(key, JSON.stringify({ count: c, date: d }))
  }, [key, getUsage])
  return { remaining, increment, isLimited: remaining === 0 }
}

// ── Streak helpers ────────────────────────────────────────────
function useStreak() {
  const get = useCallback(() => {
    if (typeof window === 'undefined') return { streak: 0, lastDate: '' }
    try { return JSON.parse(localStorage.getItem('speakfast-streak') || '{"streak":0,"lastDate":""}') } catch { return { streak: 0, lastDate: '' } }
  }, [])

  const bump = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const s = get()
    if (s.lastDate === today) return s.streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = s.lastDate === yesterday ? s.streak + 1 : 1
    const next = { streak: newStreak, lastDate: today }
    localStorage.setItem('speakfast-streak', JSON.stringify(next))
    return newStreak
  }, [get])

  const current = get()
  const today = new Date().toISOString().split('T')[0]
  return { streak: current.streak, todayDone: current.lastDate === today, bump }
}

const LANGUAGE_GROUPS = {
  'European': ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Swedish', 'Polish', 'Greek', 'Ukrainian'],
  'Asian': ['Japanese', 'Mandarin Chinese', 'Korean', 'Hindi', 'Tamil', 'Bengali', 'Vietnamese', 'Thai', 'Indonesian', 'Malay'],
  'Middle East & Africa': ['Arabic', 'Hebrew', 'Turkish', 'Persian', 'Swahili', 'Yoruba', 'Amharic'],
  'AI & Tech': ['Python', 'JavaScript', 'SQL', 'Prompt Engineering', 'AI Concepts'],
  'Other': ['Latin', 'Esperanto', 'Sign Language (ASL)', 'Old English', 'Sanskrit'],
}

const ALL_LANGUAGES = Object.values(LANGUAGE_GROUPS).flat()
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const MODES = [
  { id: 'conversation', label: '💬 Conversation', desc: 'Free-flowing chat practice' },
  { id: 'vocabulary', label: '📚 Vocabulary', desc: 'Learn 5 new words per session' },
  { id: 'grammar', label: '📐 Grammar', desc: 'Focused grammar drills' },
  { id: 'quiz', label: '🎯 Quiz me', desc: 'Test what you know' },
  { id: 'translate', label: '🔄 Translate', desc: 'Back-and-forth translation' },
  { id: 'story', label: '📖 Story', desc: 'Learn through interactive stories' },
]

interface Message { role: 'user' | 'assistant'; content: string }
interface Flashcard { word: string; translation: string; language: string; example?: string; addedAt: string }
interface GrammarError { original: string; correction: string; at: string }

// Extract word=translation pairs from assistant messages like "palabra - word" or "palabra: word"
function extractWords(text: string, language: string): Flashcard[] {
  const lines = text.split('\n')
  const cards: Flashcard[] = []
  const wordPattern = /^[•\-*\d.]+\s*(.+?)\s*[-–:]\s*(.+?)(?:\s*[-–]\s*.+)?$/
  for (const line of lines) {
    const match = line.match(wordPattern)
    if (match && match[1] && match[2]) {
      const word = match[1].replace(/^\*\*|\*\*$/g, '').trim()
      const translation = match[2].replace(/^\*\*|\*\*$/g, '').split('(')[0].trim()
      if (word.length > 0 && word.length < 40 && translation.length > 0 && translation.length < 60) {
        cards.push({ word, translation, language, addedAt: new Date().toISOString() })
      }
    }
  }
  return cards
}

// Extract grammar corrections like "✓ Better: ..." from assistant messages
function extractGrammarErrors(text: string): GrammarError[] {
  const errors: GrammarError[] = []
  const pattern = /✓\s*Better:\s*(.+?)(?:\n|$)/gi
  let match
  while ((match = pattern.exec(text)) !== null) {
    errors.push({ original: '', correction: match[1].trim(), at: new Date().toISOString() })
  }
  return errors
}

function FlashcardDeck({ cards, onClose, onAdd }: { cards: Flashcard[]; onClose: () => void; onAdd: (word: string, translation: string, language: string) => void }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [addMode, setAddMode] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newTranslation, setNewTranslation] = useState('')
  const [newLang, setNewLang] = useState('')

  const card = cards[idx]

  function markKnown() {
    setKnown(k => new Set([...k, idx]))
    setFlipped(false)
    setIdx(i => (i + 1) % Math.max(cards.length, 1))
  }

  function next() { setFlipped(false); setIdx(i => (i + 1) % Math.max(cards.length, 1)) }
  function prev() { setFlipped(false); setIdx(i => (i - 1 + Math.max(cards.length, 1)) % Math.max(cards.length, 1)) }

  function submitAdd() {
    if (!newWord.trim() || !newTranslation.trim()) return
    onAdd(newWord.trim(), newTranslation.trim(), newLang.trim() || 'Custom')
    setNewWord(''); setNewTranslation(''); setAddMode(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#111120] rounded-2xl border border-white/10 p-8 max-w-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Flashcards</h3>
            <p className="text-xs text-white/40">{cards.length} cards · {known.size} known</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddMode(m => !m)}
              className="text-xs px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all">
              + Add word
            </button>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 text-xl">✕</button>
          </div>
        </div>

        {/* Add word form */}
        {addMode && (
          <div className="mb-5 p-4 rounded-xl border border-violet-500/20 bg-violet-500/8 space-y-2">
            <input value={newWord} onChange={e => setNewWord(e.target.value)}
              placeholder="Word or phrase"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <input value={newTranslation} onChange={e => setNewTranslation(e.target.value)}
              placeholder="Translation / meaning"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <input value={newLang} onChange={e => setNewLang(e.target.value)}
              placeholder="Language (e.g. Spanish)"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <button onClick={submitAdd}
              className="w-full py-2 rounded-lg bg-violet-600 text-sm font-medium hover:bg-violet-500 transition-all">
              Save card
            </button>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 mb-4">No flashcards yet. Use Vocabulary mode or add words manually above.</p>
            <button onClick={onClose} className="px-6 py-2 rounded-lg bg-violet-600 text-sm font-medium">Close</button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="h-1 bg-white/10 rounded-full mb-6">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${(known.size / cards.length) * 100}%` }} />
            </div>

            {known.size === cards.length ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-semibold mb-1">All done!</p>
                <p className="text-white/40 text-sm mb-6">You know all {cards.length} words</p>
                <button onClick={() => { setKnown(new Set()); setIdx(0) }} className="px-6 py-2 rounded-lg bg-violet-600 text-sm font-medium">Practice again</button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setFlipped(f => !f)}
                  className="w-full min-h-[160px] rounded-xl border border-white/10 bg-white/[0.04] flex flex-col items-center justify-center gap-2 p-6 mb-6 hover:bg-white/[0.07] transition-all cursor-pointer"
                >
                  {!flipped ? (
                    <>
                      <p className="text-2xl font-bold text-white">{card.word}</p>
                      <p className="text-xs text-white/30">{card.language} · tap to reveal</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-white/40 mb-1">{card.word}</p>
                      <p className="text-xl font-bold text-violet-300">{card.translation}</p>
                      {card.example && <p className="text-xs text-white/40 text-center mt-2 italic">{card.example}</p>}
                    </>
                  )}
                </button>
                <div className="flex gap-2">
                  <button onClick={prev} className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white/50 hover:text-white transition-all">←</button>
                  <button onClick={markKnown}
                    className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all">
                    ✓ I know this
                  </button>
                  <button onClick={next} className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white/50 hover:text-white transition-all">→</button>
                </div>
                <p className="text-center text-[10px] text-white/25 mt-3">{idx + 1} / {cards.length}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function GrammarReport({ errors, onClose }: { errors: GrammarError[]; onClose: () => void }) {
  if (errors.length === 0) return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#111120] rounded-2xl border border-white/10 p-8 max-w-sm w-full text-center">
        <div className="text-3xl mb-3">✨</div>
        <p className="font-semibold mb-1">No errors recorded yet</p>
        <p className="text-white/40 text-sm mb-5">Start a session — corrections from the AI will appear here automatically.</p>
        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-violet-600 text-sm font-medium">Close</button>
      </div>
    </div>
  )

  const recent = [...errors].reverse().slice(0, 20)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#111120] rounded-2xl border border-white/10 p-8 max-w-sm w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h3 className="font-semibold">Grammar Report</h3>
            <p className="text-xs text-white/40">{errors.length} correction{errors.length !== 1 ? 's' : ''} recorded this session</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-xl">✕</button>
        </div>

        {/* Score card */}
        <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black text-violet-300">{errors.length}</div>
            <div className="text-[10px] text-white/40">total fixes</div>
          </div>
          <div className="flex-1 text-xs text-white/50 leading-relaxed">
            {errors.length <= 2 ? '🌟 Excellent! Very few mistakes.' :
             errors.length <= 5 ? '👍 Good progress — keep practising.' :
             '📈 Lots to learn from! Review corrections below.'}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {recent.map((e, i) => (
            <div key={i} className="p-3 rounded-xl border border-white/8 bg-white/[0.02]">
              <div className="text-[10px] text-white/30 mb-1">Correction #{errors.length - i}</div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">✓</span>
                <p className="text-sm text-white/80 leading-snug">{e.correction}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 text-sm font-medium hover:bg-violet-500 transition-all flex-shrink-0">
          Close
        </button>
      </div>
    </div>
  )
}

function LanguagePicker({ selected, onSelect }: { selected: string; onSelect: (l: string) => void }) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? ALL_LANGUAGES.filter(l => l.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search any language or type your own..."
        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
      />
      {filtered ? (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filtered.map(l => (
            <button key={l} onClick={() => { onSelect(l); setSearch('') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected === l ? 'bg-violet-500/25 border border-violet-500/50 text-violet-300' : 'bg-white/[0.04] border border-white/10 text-white/50 hover:text-white/80'}`}>
              {l}
            </button>
          ))}
          {filtered.length === 0 && search.length > 1 && (
            <button onClick={() => { onSelect(search); setSearch('') }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 border border-violet-500/40 text-violet-300">
              + Use &quot;{search}&quot;
            </button>
          )}
        </div>
      ) : (
        Object.entries(LANGUAGE_GROUPS).map(([group, langs]) => (
          <div key={group}>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">{group}</div>
            <div className="flex flex-wrap gap-1.5">
              {langs.map(l => (
                <button key={l} onClick={() => onSelect(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected === l ? 'bg-violet-500/25 border border-violet-500/50 text-violet-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function Home() {
  const { remaining, increment, isLimited } = useRateLimit('speakfast-usage', 20)
  const { streak, todayDone, bump } = useStreak()
  const [setup, setSetup] = useState(true)
  const [language, setLanguage] = useState('Spanish')
  const [native, setNative] = useState('English')
  const [level, setLevel] = useState('Beginner')
  const [mode, setMode] = useState('conversation')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('speakfast-cards') || '[]') } catch { return [] }
  })
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [showCards, setShowCards] = useState(false)
  const [showGrammar, setShowGrammar] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(streak)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const saveCards = useCallback((cards: Flashcard[]) => {
    setFlashcards(cards)
    localStorage.setItem('speakfast-cards', JSON.stringify(cards))
  }, [])

  const addCardManually = useCallback((word: string, translation: string, language: string) => {
    setFlashcards(prev => {
      if (prev.find(c => c.word === word && c.language === language)) return prev
      const updated = [...prev, { word, translation, language, addedAt: new Date().toISOString() }]
      localStorage.setItem('speakfast-cards', JSON.stringify(updated))
      return updated
    })
  }, [])

  const isTechLang = ['Python', 'JavaScript', 'SQL', 'Prompt Engineering', 'AI Concepts'].includes(language)

  function addWordsFromMessage(text: string) {
    if (mode !== 'vocabulary') return
    const newWords = extractWords(text, language)
    if (newWords.length > 0) {
      const merged = [...flashcards]
      for (const w of newWords) {
        if (!merged.find(c => c.word === w.word && c.language === w.language)) {
          merged.push(w)
        }
      }
      if (merged.length > flashcards.length) {
        saveCards(merged)
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2500)
      }
    }
  }

  function addGrammarFromMessage(text: string) {
    const errors = extractGrammarErrors(text)
    if (errors.length > 0) {
      setGrammarErrors(prev => [...prev, ...errors])
    }
  }

  async function startChat() {
    setSetup(false)
    setLoading(true)
    // Bump streak on first message of session
    const newStreak = bump()
    setCurrentStreak(newStreak)
    const greeting = isTechLang
      ? `Hi! I want to learn ${language}. Start with a friendly introduction and give me my first lesson.`
      : `Hello! Please greet me warmly in ${language}, introduce yourself as my tutor, and start our first ${mode} session at ${level} level.`
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: greeting, language, native, level, mode, history: [] }),
    })
    const data = await res.json()
    const reply = data.reply
    setMessages([{ role: 'assistant', content: reply }])
    addWordsFromMessage(reply)
    addGrammarFromMessage(reply)
    setLoading(false)
  }

  async function send() {
    if (!input.trim() || loading || isLimited) return
    increment()
    const userMsg = input.trim()
    setInput('')
    const newMsgs: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMsgs)
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, language, native, level, mode, history: messages }),
    })
    const data = await res.json()
    const reply = data.reply
    setMessages([...newMsgs, { role: 'assistant', content: reply }])
    setWordCount(w => w + userMsg.split(' ').length)
    addWordsFromMessage(reply)
    addGrammarFromMessage(reply)
    setLoading(false)
  }

  const modeObj = MODES.find(m => m.id === mode)
  const langCards = flashcards.filter(c => c.language === language)

  if (setup) return (
    <main className="min-h-screen relative z-10">
      {/* Ambient */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-700/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-pink-600/12 blur-[120px]" />
      </div>

      {/* Sticky nav */}
      <nav className="border-b border-white/8 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-violet-500/30">🗣️</div>
            <div>
              <span className="font-black text-lg tracking-tight">SpeakFast</span>
              <span className="hidden sm:inline text-[10px] text-white/30 ml-2 font-normal">AI Language Tutor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {streak > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${todayDone ? 'border-orange-500/40 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-white/[0.04] text-white/40'}`}>
                🔥 {streak} day{streak !== 1 ? 's' : ''}
              </div>
            )}
            {flashcards.length > 0 && (
              <button onClick={() => setShowCards(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 text-xs font-semibold hover:bg-violet-500/15 transition-all">
                📇 {flashcards.length} cards
              </button>
            )}
            <div className="px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.04] text-xs text-white/40">
              50+ languages
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-10 pb-16">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI Tutor · Flashcards · Streaks · 50+ Languages
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3">
            Learn faster<br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">with AI.</span>
          </h1>
          <p className="text-white/45 text-base">Pick a language, choose your goal, and start a real conversation with your AI tutor — completely free.</p>

          {/* Streak + feature teasers */}
          <div className="flex items-center justify-center gap-6 mt-5 text-sm">
            {[
              { icon: '🔥', label: streak > 0 ? `${streak}-day streak` : 'Start your streak' },
              { icon: '📇', label: 'Auto flashcards' },
              { icon: '📊', label: 'Grammar reports' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-white/40">
                <span>{s.icon}</span>
                <span className="text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {showCards && <FlashcardDeck cards={flashcards} onClose={() => setShowCards(false)} onAdd={addCardManually} />}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-7 space-y-6" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.15)' }}>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">
              What do you want to learn?
              <span className="ml-2 text-violet-400 normal-case">50+ languages + AI/Tech</span>
            </label>
            <LanguagePicker selected={language} onSelect={setLanguage} />
          </div>

          {language && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/25">
              <span className="text-violet-300 font-semibold">{language}</span>
              <span className="text-white/30 text-xs">selected</span>
              {langCards.length > 0 && (
                <span className="ml-auto text-xs text-violet-400/70">📇 {langCards.length} cards</span>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">My level</label>
            <div className="flex gap-3">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${level === l ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>
                  {l === 'Beginner' ? '🌱 ' : l === 'Intermediate' ? '🌿 ' : '🌳 '}{l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Session type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`p-3 rounded-xl text-left transition-all ${mode === m.id ? 'bg-violet-500/20 border border-violet-500/40' : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.06]'}`}>
                  <div className={`text-xs font-semibold mb-0.5 ${mode === m.id ? 'text-violet-300' : 'text-white/70'}`}>{m.label}</div>
                  <div className="text-[10px] text-white/30">{m.desc}</div>
                  {m.id === 'vocabulary' && <div className="text-[10px] text-violet-400/60 mt-0.5">Auto-saves flashcards</div>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Your native language (for explanations)</label>
            <input value={native} onChange={e => setNative(e.target.value)}
              placeholder="English, Tamil, Hindi, Arabic..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder-white/25" />
          </div>

          <button onClick={startChat}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 font-bold text-base transition-all shadow-lg shadow-violet-500/25">
            Start {modeObj?.label || '💬 Conversation'} in {language} →
          </button>
        </div>
      </div>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 border-t border-white/5 mt-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black mb-2">Simple pricing</h2>
            <p className="text-white/35 text-sm">20 messages free every day · No credit card</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px border border-white/10 rounded-2xl overflow-hidden">
            {[
              { name: 'Free', price: '$0', sub: 'forever', features: ['20 messages / day', '50+ languages', '6 session modes', 'Auto flashcard saving', 'Custom vocab lists', 'Daily streak tracking'], cta: 'Start free', highlight: false },
              { name: 'Pro', price: '$5', sub: '/month', features: ['Unlimited messages', 'Save study progress', 'Grammar report cards', 'Pronunciation feedback', 'Offline flashcards', 'Priority AI speed'], cta: 'Go Pro →', highlight: true },
            ].map(plan => (
              <div key={plan.name} className={`p-7 ${plan.highlight ? 'bg-violet-950/40' : 'bg-white/[0.02]'}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-violet-400' : 'text-white/30'}`}>{plan.name}</div>
                <div className={`text-4xl font-black mb-0.5 ${plan.highlight ? 'text-white' : 'text-white/50'}`}>{plan.price}</div>
                <div className={`text-sm mb-5 ${plan.highlight ? 'text-violet-600' : 'text-white/25'}`}>{plan.sub}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-white/70' : 'text-white/30'}`}>
                      <span className={plan.highlight ? 'text-violet-400 mt-0.5' : 'text-white/20 mt-0.5'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${plan.highlight ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500' : 'border border-white/10 text-white/30 cursor-default'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col relative z-10">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-violet-700/12 blur-[130px]" />
      </div>

      {showCards && <FlashcardDeck cards={langCards.length > 0 ? langCards : flashcards} onClose={() => setShowCards(false)} onAdd={addCardManually} />}
      {showGrammar && <GrammarReport errors={grammarErrors} onClose={() => setShowGrammar(false)} />}

      {/* Saved words toast */}
      {savedFlash && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-500/30">
          📇 Words saved to flashcards!
        </div>
      )}

      <nav className="border-b border-white/8 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-violet-500/30">🗣️</div>
            <div>
              <div className="font-bold text-sm">{language} <span className="text-white/30">·</span> {modeObj?.label}</div>
              <div className="text-[10px] text-white/35">{level} level · {native} speaker</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {currentStreak > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold">
                🔥 {currentStreak}
              </div>
            )}
            <div className="hidden sm:flex items-center gap-3 text-xs text-white/30">
              <span>💬 {messages.length}</span>
              {wordCount > 0 && <span>📝 {wordCount}w</span>}
            </div>
            {/* Grammar report button */}
            <button onClick={() => setShowGrammar(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/50 hover:text-white/80 transition-all">
              📊 {grammarErrors.length}
            </button>
            {/* Flashcard button */}
            <button onClick={() => setShowCards(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/50 hover:text-white/80 transition-all">
              📇 {langCards.length > 0 ? langCards.length : flashcards.length}
            </button>
            <select value={mode} onChange={e => setMode(e.target.value)}
              className="bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none">
              {MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <button onClick={() => { setSetup(true); setMessages([]); setWordCount(0); setGrammarErrors([]) }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">
              ↩
            </button>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">✦</div>
              )}
              <div className={`max-w-[82%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-600/30 border border-violet-500/30 text-white rounded-tr-sm'
                  : 'bg-white/[0.05] border border-white/[0.08] text-white/90 rounded-tl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm mr-3 flex-shrink-0">✦</div>
              <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length > 0 && messages.length < 4 && (
        <div className="border-t border-white/5 bg-black/10 px-4 py-2">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1">
            {(mode === 'vocabulary'
              ? ['Teach me 5 more words', 'Give me example sentences', 'Quiz me on these words', 'Teach me numbers 1-10']
              : ['How do I say "thank you"?', 'Correct my last message', 'Give me a quiz', 'Tell me something interesting']
            ).map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/5 bg-black/20 backdrop-blur-xl p-4">
        <div className="max-w-3xl mx-auto">
          {isLimited ? (
            <div className="text-center py-2 px-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-amber-400 text-sm font-semibold">Daily limit reached (20 free messages/day)</p>
              <a href="#pricing" className="text-xs text-amber-600 hover:text-amber-400 underline">Upgrade for unlimited →</a>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={mode === 'quiz' ? 'Type your answer...' : mode === 'translate' ? 'Type to translate...' : `Reply in ${language} or ask anything...`}
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 font-semibold text-sm transition-all disabled:opacity-40">
                Send
              </button>
            </div>
          )}
          {!isLimited && remaining < 10 && (
            <p className="text-center text-[10px] text-white/20 mt-2">{remaining} messages left today · <a href="#pricing" className="text-violet-400/50 hover:text-violet-400">Upgrade for unlimited</a></p>
          )}
        </div>
      </div>
    </main>
  )
}
