'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useGate } from '@/lib/shared/useGate'
import RegisterGate from '@/lib/shared/RegisterGate'
import { StreakBadge } from '@/components/design'
import { HeartsDisplay } from '@/components/gamification'
import { loseHeart } from '@/lib/gamification/hearts'
import GuidedTour, { type TourStep } from '@/components/GuidedTour'

const SPEAKIQ_TOUR: TourStep[] = [
  { target: '#hero-start-btn', title: 'Start learning free', icon: '🌍', body: 'Pick a language, set your level, and start chatting with your AI tutor instantly. No account needed.', placement: 'bottom' },
  { target: '#pricing', title: 'Go unlimited', icon: '⚡', body: 'Pro unlocks unlimited sessions, grammar reports, and progress saved forever.', placement: 'top' },
]

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

const LANGUAGE_FLAGS: Record<string, string> = {
  Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Italian: '🇮🇹', Portuguese: '🇵🇹',
  Dutch: '🇳🇱', Swedish: '🇸🇪', Polish: '🇵🇱', Greek: '🇬🇷', Ukrainian: '🇺🇦',
  Japanese: '🇯🇵', 'Mandarin Chinese': '🇨🇳', Korean: '🇰🇷', Hindi: '🇮🇳', Tamil: '🇮🇳',
  Bengali: '🇧🇩', Vietnamese: '🇻🇳', Thai: '🇹🇭', Indonesian: '🇮🇩', Malay: '🇲🇾',
  Arabic: '🇸🇦', Hebrew: '🇮🇱', Turkish: '🇹🇷', Persian: '🇮🇷', Swahili: '🇰🇪',
  Yoruba: '🇳🇬', Amharic: '🇪🇹', Python: '🐍', JavaScript: '⚡', SQL: '🗄️',
  'Prompt Engineering': '🤖', 'AI Concepts': '🧠', Latin: '🏛️', Esperanto: '🌍',
  'Sign Language (ASL)': '🤟', 'Old English': '📜', Sanskrit: '🕉️',
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
  { id: 'interview', label: '🎤 Mock Interview', desc: 'Real interview — AI grades every answer' },
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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const filtered = search.trim()
    ? ALL_LANGUAGES.filter(l => l.toLowerCase().includes(search.toLowerCase()))
    : null

  function pick(l: string) { onSelect(l); setOpen(false); setSearch('') }

  function openDrop() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const flag = LANGUAGE_FLAGS[selected] || '🌍'
  const groupName = Object.entries(LANGUAGE_GROUPS).find(([, langs]) => langs.includes(selected))?.[0] ?? 'Custom'

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openDrop}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
          open ? 'border-violet-500/60 bg-violet-500/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'
        }`}
      >
        <span className="text-2xl leading-none">{flag}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{selected}</div>
          <div className="text-[10px] text-white/30 mt-0.5">{groupName}</div>
        </div>
        <span className={`text-white/30 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Portal-style fixed dropdown */}
      {open && dropPos && (
        <div
          className="fixed z-[200] rounded-2xl border border-white/12 bg-[#0e0e1e]/97 backdrop-blur-xl shadow-2xl shadow-black/70 overflow-hidden"
          style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
        >
          <div className="p-3 border-b border-white/8">
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered ? (
              <div className="p-2">
                {filtered.map(l => (
                  <button key={l} onClick={() => pick(l)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                      selected === l ? 'bg-violet-500/20 text-violet-300' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                    }`}>
                    <span className="text-xl w-7 text-center shrink-0">{LANGUAGE_FLAGS[l] || '🌍'}</span>
                    <span className="text-sm font-medium">{l}</span>
                    {selected === l && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                  </button>
                ))}
                {filtered.length === 0 && search.length > 1 && (
                  <button onClick={() => pick(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all">
                    <span className="text-xl w-7 text-center shrink-0">🌍</span>
                    <span className="text-sm font-medium">Use &quot;{search}&quot;</span>
                  </button>
                )}
              </div>
            ) : (
              Object.entries(LANGUAGE_GROUPS).map(([group, langs]) => (
                <div key={group}>
                  <div className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-white/25">{group}</div>
                  {langs.map(l => (
                    <button key={l} onClick={() => pick(l)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all ${
                        selected === l ? 'bg-violet-500/20 text-violet-300' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                      }`}>
                      <span className="text-xl w-7 text-center shrink-0">{LANGUAGE_FLAGS[l] || '🌍'}</span>
                      <span className="text-sm">{l}</span>
                      {selected === l && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close */}
      {open && <div className="fixed inset-0 z-[199]" onClick={() => { setOpen(false); setSearch('') }} />}
    </>
  )
}

export default function Home() {
  const { count: gateCount, showGate, increment: gateIncrement, onRegistered, dismissGate, isRegistered } = useGate('speakiq', 20)
  const remaining = Math.max(0, 20 - gateCount)
  const [isPro, setIsPro] = useState(false)
  const isLimited = !isRegistered && !isPro && gateCount >= 20
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const { streak, todayDone, bump } = useStreak()
  const [setup, setSetup] = useState(true)
  const [language, setLanguage] = useState('Spanish')
  const [native, setNative] = useState('English')
  const [level, setLevel] = useState('Beginner')
  const [mode, setMode] = useState('conversation')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
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
  const [interviewProfile, setInterviewProfile] = useState({
    jobTitle: '',
    jobDescription: '',
    targetCompany: '',
    yearsExp: '',
    skills: '',
    interviewType: 'technical', // technical | behavioural | language-proficiency | mixed
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [streamingContent])

  // Lock body scroll + hide global footer/navbar in chat mode
  useEffect(() => {
    const nav = document.getElementById('layout-nav')
    const footer = document.getElementById('layout-footer')
    if (!setup) {
      document.body.style.overflow = 'hidden'
      if (nav) nav.style.display = 'none'
      if (footer) footer.style.display = 'none'
    } else {
      document.body.style.overflow = ''
      if (nav) nav.style.display = ''
      if (footer) footer.style.display = ''
    }
    return () => {
      document.body.style.overflow = ''
      const n = document.getElementById('layout-nav')
      const f = document.getElementById('layout-footer')
      if (n) n.style.display = ''
      if (f) f.style.display = ''
    }
  }, [setup])

  // Escape key closes open modals
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showCards) { setShowCards(false); return }
      if (showGrammar) { setShowGrammar(false); return }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showCards, showGrammar])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('speakiq-pro') === '1') setIsPro(true)
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      localStorage.setItem('speakiq-pro', '1')
      setIsPro(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const handleUpgrade = useCallback(async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { /* ignore */ } finally {
      setCheckoutLoading(false)
    }
  }, [])

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
    // Scroll to top so chat nav is visible immediately
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
    setLoading(true)
    // Save prefs for daily challenge + other pages
    if (typeof window !== 'undefined') {
      localStorage.setItem('speakfast-prefs', JSON.stringify({ language, level }))
    }
    // Bump streak on first message of session
    const newStreak = bump()
    setCurrentStreak(newStreak)
    let greeting: string
    if (mode === 'interview') {
      const { jobTitle, targetCompany, yearsExp, interviewType } = interviewProfile
      const roleContext = jobTitle ? `I am applying for a ${jobTitle}${targetCompany ? ` role at ${targetCompany}` : ''}` : ''
      const expContext = yearsExp ? `, with ${yearsExp} years of experience` : ''
      greeting = isTechLang
        ? `${roleContext}${expContext}. Start my ${level}-level ${language} ${interviewType} interview now.`
        : `I am ready for my ${level}-level ${language} language proficiency interview${roleContext ? ` (${roleContext})` : ''}. Please begin.`
    } else if (isTechLang) {
      greeting = `Hi! I want to learn ${language}. Start with a friendly introduction and give me my first lesson.`
    } else {
      greeting = `Hello! Please greet me warmly in ${language}, introduce yourself as my tutor, and start our first ${mode} session at ${level} level.`
    }
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: greeting, language, native, level, mode, history: [], interviewProfile: mode === 'interview' ? interviewProfile : null }),
    })
    const data = await res.json()
    const reply = data.reply
    setMessages([{ role: 'assistant', content: reply }])
    addWordsFromMessage(reply)
    addGrammarFromMessage(reply)
    setLoading(false)
  }

  async function send() {
    if (!input.trim() || loading) return
    const allowed = await gateIncrement()
    if (!allowed) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMsgs)
    setLoading(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, language, native, level, mode, history: messages, interviewProfile: mode === 'interview' ? interviewProfile : null }),
      })

      if (!res.ok || !res.body) throw new Error('stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let reply = ''
      setLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const token: string = JSON.parse(data)
            reply += token
            setStreamingContent(reply)
          } catch { /* skip malformed */ }
        }
      }

      setStreamingContent('')
      setMessages([...newMsgs, { role: 'assistant', content: reply }])
      setWordCount(w => w + userMsg.split(' ').length)
      addWordsFromMessage(reply)
      addGrammarFromMessage(reply)
      if ((mode === 'quiz' || mode === 'interview') && /incorrect|wrong|❌/i.test(reply)) {
        loseHeart()
      }
    } catch {
      // Fallback to non-streaming
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, language, native, level, mode, history: messages, interviewProfile: mode === 'interview' ? interviewProfile : null }),
      })
      const data = await res.json()
      const reply = data.reply
      setStreamingContent('')
      setMessages([...newMsgs, { role: 'assistant', content: reply }])
      setWordCount(w => w + userMsg.split(' ').length)
      addWordsFromMessage(reply)
      addGrammarFromMessage(reply)
      if ((mode === 'quiz' || mode === 'interview') && /incorrect|wrong|❌/i.test(reply)) {
        loseHeart()
      }
      setLoading(false)
    }
  }

  const modeObj = MODES.find(m => m.id === mode)
  const langCards = flashcards.filter(c => c.language === language)

  if (setup) return (
    <>
    {showGate && (
      <RegisterGate
        freeUsed={gateCount}
        freeLimit={20}
        freeFeature="messages"
        lockedFeature="unlimited messages"
        accentColor="#7c3aed"
        site="speakiq"
        onSuccess={onRegistered}
        onDismiss={dismissGate}
      />
    )}
    <main className="min-h-screen relative z-10 overflow-x-hidden flex flex-col">
      {/* ── Background system ── */}
      {/* Fixed dot-grid pattern */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} aria-hidden="true" />
      {/* Radial gradient vignette over grid */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse 80% 60% at 20% 30%, rgba(124,58,237,0.40) 0%, transparent 60%),
                     radial-gradient(ellipse 60% 50% at 80% 70%, rgba(6,182,212,0.28) 0%, transparent 55%),
                     radial-gradient(ellipse 50% 40% at 60% 10%, rgba(168,85,247,0.25) 0%, transparent 50%)`,
      }} aria-hidden="true" />
      {/* Edge fade so grid fades to black at corners */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(6,6,16,0.85) 100%)`,
      }} aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      {showCards && <FlashcardDeck cards={flashcards} onClose={() => setShowCards(false)} onAdd={addCardManually} />}

      {/* ── Flashcard quick-access (setup screen only) ── */}
      {flashcards.length > 0 && (
        <div className="max-w-5xl mx-auto px-5 pt-4 flex justify-end">
          <button onClick={() => setShowCards(true)} className="pill-glass text-xs text-violet-300 px-3 py-1.5 rounded-full hover:bg-violet-500/20 transition-all">
            📇 {flashcards.length}
          </button>
        </div>
      )}

      {/* ── Hero + Setup — single viewport ── */}
      <section className="flex-1 max-w-5xl w-full mx-auto px-5 pt-4 sm:pt-10 pb-8 relative">
        {/* Two-column layout: setup first on mobile, hero left on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* Left: hero copy — shown second on mobile, first on desktop */}
          <div className="order-2 lg:order-1 flex flex-col">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-300 text-xs font-bold mb-4 backdrop-blur-sm">
              🌍 50+ Languages · AI Native Speaker Tutor · $7/mo
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-3">
              Your AI<br />
              <span className="text-iridescent">language tutor</span><br />
              <span className="text-white/35">available 24/7</span>
            </h1>

            <p className="text-white/50 text-sm max-w-sm leading-relaxed mb-4">
              Real conversations · instant corrections · automatic flashcards
            </p>

            {/* Gamification strip */}
            {(currentStreak > 0) && (
              <div className="flex items-center gap-3 mb-4">
                <StreakBadge count={currentStreak} />
                <HeartsDisplay />
              </div>
            )}

            {/* Stats row — compact */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { val: '50+', label: 'Languages' },
                { val: '7', label: 'Modes' },
                { val: '$7', label: 'Pro/mo' },
                { val: '20', label: 'Free/day' },
              ].map(s => (
                <div key={s.label} className="glass-liquid rounded-xl py-2.5 text-center">
                  <div className="text-lg font-black text-white">{s.val}</div>
                  <div className="text-[9px] text-white/35 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Live demo preview — desktop only */}
            <div className="hidden lg:block rounded-xl border border-white/[0.07] bg-black/30 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full bg-violet-500/60" />
                <span className="text-[10px] text-white/25 font-mono">speakiq · live session</span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400/60">AI ready</span>
                </span>
              </div>
              <div className="p-3 space-y-2 font-mono text-[10px]">
                <div className="flex gap-2">
                  <span className="text-violet-400/50 shrink-0">tutor</span>
                  <span className="text-white/50">Hola! ¿Cómo te llamas? 👋</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <span className="text-white/40">Me llamo Alex.</span>
                  <span className="text-cyan-400/50 shrink-0">you</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-violet-400/50 shrink-0">tutor</span>
                  <span className="text-white/50">¡Perfecto! <span className="text-emerald-400/70">✓ Great!</span></span>
                </div>
              </div>
            </div>

            {/* Pricing quick toggle — pushed to bottom of column */}
            <div id="pricing" className="mt-auto pt-6 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] grid grid-cols-2 gap-px overflow-hidden">
              {[
                { name: 'Free', price: '$0', sub: 'forever', features: ['20 messages/day', '50+ languages', '7 session modes', 'Auto flashcards'], highlight: false },
                { name: 'Pro', price: '$7', sub: '/month', features: ['Unlimited messages', 'Grammar reports', 'Progress saved forever', 'Priority AI speed'], highlight: true },
              ].map(plan => (
                <div key={plan.name} className={`p-4 ${plan.highlight ? 'bg-violet-950/50' : 'bg-white/[0.01]'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-violet-400' : 'text-white/25'}`}>{plan.name}</div>
                  <div className={`text-2xl font-black mb-0.5 ${plan.highlight ? 'text-white' : 'text-white/40'}`}>{plan.price}</div>
                  <div className={`text-[10px] mb-3 ${plan.highlight ? 'text-violet-500' : 'text-white/20'}`}>{plan.sub}</div>
                  <ul className="space-y-1 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-1.5 text-[11px] ${plan.highlight ? 'text-white/60' : 'text-white/25'}`}>
                        <span className={plan.highlight ? 'text-violet-400' : 'text-white/15'}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  {plan.highlight && (
                    <button onClick={!isPro ? handleUpgrade : undefined} disabled={isPro || checkoutLoading}
                      className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400">
                      {isPro ? '✓ Active' : checkoutLoading ? 'Redirecting...' : 'Upgrade →'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: setup panel — shown first on mobile */}
          <div className="order-1 lg:order-2 flex flex-col">
            {/* Mobile-only tagline — navbar already shows logo, just add context */}
            <div className="lg:hidden mb-4">
              <p className="text-sm text-white/50 leading-snug">AI tutor for 50+ languages. Pick your language and start a free conversation — no account needed.</p>
            </div>
            <div className="glass-liquid rounded-2xl p-6 space-y-5 flex-1" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.15)' }}>
              <div className="flex items-center justify-between">
                <h2 className="font-black text-base text-white">Configure your session</h2>
                {isPro && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded font-bold">⚡ PRO</span>}
              </div>

              {/* Language picker */}
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider mb-2.5 block">
                  What do you want to learn?
                  <span className="ml-2 text-violet-400 normal-case">50+ languages + AI/Tech</span>
                </label>
                <LanguagePicker selected={language} onSelect={setLanguage} />
              </div>

              {langCards.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/8 border border-violet-500/15 text-xs text-violet-400/60">
                  📇 {langCards.length} {language} flashcard{langCards.length !== 1 ? 's' : ''} saved
                </div>
              )}

              {/* Level */}
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider mb-2 block">My level</label>
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <button key={l} onClick={() => setLevel(l)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${level === l ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border border-white/8 text-white/35 hover:text-white/60'}`}>
                      {l === 'Beginner' ? '🌱 ' : l === 'Intermediate' ? '🌿 ' : '🌳 '}{l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode grid */}
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider mb-2 block">Session type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2 ${mode === m.id ? 'bg-violet-600/30 border-2 border-violet-400/70' : m.id === 'interview' ? 'bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10' : 'bg-white/[0.03] border border-white/8 hover:bg-white/[0.07] hover:border-white/20'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-semibold leading-tight ${mode === m.id ? 'text-white' : m.id === 'interview' ? 'text-amber-300/80' : 'text-white/70'}`}>{m.label}</span>
                          {m.id === 'interview' && mode !== m.id && (
                            <span className="text-[7px] font-bold bg-amber-500/25 text-amber-300 px-1 py-0.5 rounded-full leading-none">NEW</span>
                          )}
                        </div>
                        <div className={`text-[9px] mt-0.5 leading-tight ${mode === m.id ? 'text-violet-200/60' : 'text-white/25'}`}>{m.desc}</div>
                      </div>
                      <span className={`text-sm shrink-0 transition-transform ${mode === m.id ? 'text-violet-300 translate-x-0.5' : 'text-white/20'}`}>›</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview profile — collapsed form */}
              {mode === 'interview' && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 text-xs font-bold">🎤 Interview Setup</span>
                    <span className="text-[9px] text-white/25">more context = more realistic</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={interviewProfile.jobTitle} onChange={e => setInterviewProfile(p => ({ ...p, jobTitle: e.target.value }))}
                      placeholder="Job title / role"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all placeholder-white/20" />
                    <input value={interviewProfile.targetCompany} onChange={e => setInterviewProfile(p => ({ ...p, targetCompany: e.target.value }))}
                      placeholder="Target company"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all placeholder-white/20" />
                    <input value={interviewProfile.yearsExp} onChange={e => setInterviewProfile(p => ({ ...p, yearsExp: e.target.value }))}
                      placeholder="Years of experience"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all placeholder-white/20" />
                    <select value={interviewProfile.interviewType} onChange={e => setInterviewProfile(p => ({ ...p, interviewType: e.target.value }))}
                      className="w-full bg-black/40 border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all">
                      <option value="technical">💻 Technical</option>
                      <option value="behavioural">🧠 Behavioural (STAR)</option>
                      <option value="mixed">⚡ Mixed</option>
                      <option value="system-design">🏗️ System Design</option>
                      <option value="language-proficiency">🌍 Language Proficiency</option>
                    </select>
                  </div>
                  <input value={interviewProfile.skills} onChange={e => setInterviewProfile(p => ({ ...p, skills: e.target.value }))}
                    placeholder="Key skills: React, TypeScript, SQL..."
                    className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all placeholder-white/20" />
                  <textarea value={interviewProfile.jobDescription} onChange={e => setInterviewProfile(p => ({ ...p, jobDescription: e.target.value }))}
                    placeholder="Paste job description for ultra-precise questions (optional)..."
                    rows={2}
                    className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all placeholder-white/20 resize-none" />
                </div>
              )}

              {/* Native language */}
              <input value={native} onChange={e => setNative(e.target.value)}
                placeholder="Your native language (e.g. English, Tamil, Hindi...)"
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500/40 transition-all placeholder-white/20" />

              {/* Trust bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/30 pt-1">
                <span>50+ languages</span>
                <span>·</span>
                <span>Free to start</span>
                <span>·</span>
                <a href="/pricing" className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition">See pricing</a>
              </div>

              {/* CTA */}
              <button id="hero-start-btn" onClick={startChat}
                className="btn-liquid w-full py-3.5 rounded-xl font-black text-sm text-white transition-all justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 30px rgba(124,58,237,0.35)' }}>
                Start {modeObj?.label || '💬 Conversation'} in {language} →
              </button>

              <p className="text-center text-[10px] text-white/20">20 free messages/day · No credit card needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Minimal footer ── */}
      <footer className="border-t border-white/[0.05] px-5 py-6 text-center text-[11px] text-white/20">
        SpeakIQ · AI language & interview coaching · <button onClick={handleUpgrade} disabled={isPro} className="text-violet-400/50 hover:text-violet-400 transition-colors disabled:opacity-50">Upgrade to Pro $7/mo</button>
      </footer>
    </main>
    </>
  )

  return (
    <>
    {showGate && (
      <RegisterGate
        freeUsed={gateCount}
        freeLimit={20}
        freeFeature="messages"
        lockedFeature="unlimited messages"
        accentColor="#7c3aed"
        site="speakiq"
        onSuccess={onRegistered}
        onDismiss={dismissGate}
      />
    )}
    <main className="flex flex-col z-10 overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Aurora background — unique to SpeakIQ */}
      <div className="aurora-orb-1" aria-hidden="true" />
      <div className="aurora-orb-2" aria-hidden="true" />
      <div className="aurora-orb-3" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      {showCards && <FlashcardDeck cards={langCards.length > 0 ? langCards : flashcards} onClose={() => setShowCards(false)} onAdd={addCardManually} />}
      {showGrammar && <GrammarReport errors={grammarErrors} onClose={() => setShowGrammar(false)} />}

      {/* Saved words toast */}
      {savedFlash && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-500/30">
          📇 Words saved to flashcards!
        </div>
      )}

      <nav className="border-b border-white/[0.06] backdrop-blur-xl bg-black/30 shrink-0">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          {/* Left: ← Home + inline session selectors */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => { setSetup(true); setMessages([]); setWordCount(0); setGrammarErrors([]) }}
              className="flex items-center gap-1 shrink-0 group px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-violet-500/10 hover:border-violet-500/40 transition-all"
              aria-label="Back to home"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-white/40 group-hover:text-violet-400 transition-colors">
                <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[11px] font-semibold text-white/40 group-hover:text-violet-400 transition-colors">Home</span>
            </button>
            <span className="text-white/10 shrink-0">|</span>
            {/* Language selector */}
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-white/70 focus:outline-none cursor-pointer hover:text-white transition-colors max-w-[90px] truncate">
              {ALL_LANGUAGES.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
            </select>
            <span className="text-white/10 shrink-0">·</span>
            {/* Level selector — always visible */}
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="bg-transparent border-0 text-xs text-white/40 focus:outline-none cursor-pointer hover:text-white/70 transition-colors">
              {LEVELS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
            </select>
            <span className="text-white/10 shrink-0 hidden sm:block">·</span>
            {/* Mode selector — desktop only (too wide for mobile) */}
            <select value={mode} onChange={e => setMode(e.target.value)}
              className="hidden sm:block bg-transparent border-0 text-xs text-white/40 focus:outline-none cursor-pointer hover:text-white/70 transition-colors max-w-[110px] truncate">
              {MODES.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.label}</option>)}
            </select>
          </div>

          {/* Right: tools + streak */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentStreak > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-orange-500/20 bg-orange-500/[0.08] text-orange-300 text-xs font-semibold">
                🔥 {currentStreak}
              </div>
            )}
            {!isPro && (
              <span className={`hidden sm:block text-xs px-2 ${remaining <= 5 ? 'text-orange-400 font-semibold' : 'text-white/25'}`}>⚡ {remaining}/20</span>
            )}
            <button onClick={() => setShowGrammar(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all">
              📊 <span className="text-[10px]">{grammarErrors.length}</span>
            </button>
            <button onClick={() => setShowCards(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all">
              📇 <span className="text-[10px]">{langCards.length > 0 ? langCards.length : flashcards.length}</span>
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">✦</div>
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
          {streamingContent && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">✦</div>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap bg-white/[0.05] border border-white/[0.08] text-white/90">
                {streamingContent}<span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-text-bottom" />
              </div>
            </div>
          )}
          {loading && !streamingContent && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm mr-3 flex-shrink-0">✦</div>
              <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length > 0 && messages.length < 10 && (
        <div className="border-t border-white/5 bg-black/10 shrink-0 px-4 py-2 w-full">
          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            {(mode === 'vocabulary'
              ? ['Teach me 5 more words', 'Give me example sentences', 'Quiz me on these words', 'Teach me numbers 1-10']
              : ['How do I say "thank you"?', 'Correct my last message', 'Give me a quiz', 'Tell me something interesting']
            ).map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
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
            <div className="text-center py-3 px-4 rounded-xl border border-violet-500/20 bg-violet-950/30 space-y-2">
              <p className="text-white/70 text-sm font-semibold">Daily limit reached — 20 free messages used</p>
              <button onClick={handleUpgrade} disabled={checkoutLoading}
                className="px-6 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 inline-block"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                {checkoutLoading ? 'Redirecting...' : 'Go Pro — $7/mo for unlimited →'}
              </button>
              <p className="text-white/20 text-[10px]">Cancel anytime · Secure via Stripe</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={mode === 'interview' ? 'Give your answer...' : mode === 'quiz' ? 'Type your answer...' : mode === 'translate' ? 'Type to translate...' : `Reply in ${language} or ask anything...`}
                autoFocus
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                Send
              </button>
            </div>
          )}
          {!isLimited && remaining < 10 && (
            <p className="text-center text-[10px] text-white/20 mt-2">{remaining} messages left today · <a href="#pricing" className="text-violet-400/50 hover:text-violet-400">Upgrade for unlimited</a></p>
          )}
        </div>
      </div>
      <GuidedTour steps={SPEAKIQ_TOUR} storageKey="speakiq_tour_v1" accentColor="#7c3aed" />
    </main>
    </>
  )
}
