'use client'
import { useState, useRef, useEffect } from 'react'
import { getTutorName, getTutorContext } from '@/lib/gamification/tutor-memory'

interface Correction { original: string; fixed: string; explanation: string }
interface Turn {
  role: 'user' | 'assistant'
  content: string
  translation?: string
  corrections?: Correction[]
}

interface Props { language: string; level: string; tutorName?: string; className?: string }

const STARTER_PROMPTS: Record<string, string[]> = {
  Beginner: ['Hello! How are you?', 'What is your name?', 'I like coffee.'],
  Intermediate: ['Tell me about your weekend.', 'What do you do for fun?', 'Describe your city.'],
  Advanced: ['Let\'s discuss current events.', 'What\'s your opinion on travel?', 'Tell me a short story.'],
}

export function ConversationMode({ language, level, tutorName = 'Luna', className = '' }: Props) {
  const [turns,   setTurns]   = useState<Turn[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns, loading])

  // Auto-greet on mount
  useEffect(() => {
    setLoading(true)
    const resolvedName = getTutorName() || tutorName
    fetch('/api/converse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `[SYSTEM: Start the conversation with a warm greeting in ${language}. Keep it short — 1-2 sentences. Ask an opening question to get the learner talking.]` }],
        language, level, tutorName: resolvedName, weakSpotContext: getTutorContext(),
      }),
    })
      .then(r => r.json())
      .then(data => {
        setTurns([{
          role: 'assistant',
          content: data.reply ?? `Hola! I'm ${resolvedName}. How are you today?`,
          translation: data.replyTranslation,
        }])
      })
      .catch(() => {
        setTurns([{
          role: 'assistant',
          content: `Hi! I'm ${resolvedName}, your ${language} tutor. Ready to practice?`,
        }])
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const userTurn: Turn = { role: 'user', content: msg }
    setTurns(prev => [...prev, userTurn])
    setLoading(true)
    try {
      const messages = [...turns, userTurn].map(t => ({ role: t.role, content: t.content }))
      const resolvedName = getTutorName()
      const r = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, language, level, tutorName: resolvedName, weakSpotContext: getTutorContext() }),
      })
      const data = await r.json()
      setTurns(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? '',
        translation: data.replyTranslation,
        corrections: data.corrections ?? [],
      }])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const starters = STARTER_PROMPTS[level] ?? STARTER_PROMPTS.Beginner
  const showStarters = turns.length <= 1 && !loading

  return (
    <div className={`flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden ${className}`} style={className ? undefined : { height: 'calc(100dvh - 130px)', minHeight: '520px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-sm">🤖</div>
        <div>
          <p className="font-semibold text-sm leading-none">{tutorName}</p>
          <p className="text-xs text-[var(--text-2)] mt-0.5">{language} · {level}</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {turns.map((t, i) => (
          <div key={i} className={`flex flex-col gap-1 ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              t.role === 'user'
                ? 'bg-[var(--theme-primary)] text-white rounded-br-sm'
                : 'bg-white/10 text-white rounded-bl-sm'
            }`}>
              {t.content}
            </div>
            {t.translation && (
              <p className="text-xs text-[var(--text-2)] px-1 italic">{t.translation}</p>
            )}
            {t.corrections && t.corrections.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 text-xs space-y-1.5 max-w-[78%]">
                <p className="text-yellow-400/80 font-medium text-[10px] uppercase tracking-wide">Corrections</p>
                {t.corrections.map((c, ci) => (
                  <div key={ci} className="space-y-0.5">
                    <p><span className="line-through text-red-400">{c.original}</span><span className="text-[var(--text-2)]"> → </span><span className="text-green-400">{c.fixed}</span></p>
                    <p className="text-[var(--text-2)]">{c.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Starter chips — shown below tutor's first message */}
        {showStarters && (
          <div className="pt-1 space-y-2">
            <p className="text-xs text-[var(--text-2)] text-center">Try saying:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs hover:bg-white/10 hover:border-white/30 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Write in ${language}...`}
          className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-[var(--theme-primary)] transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-[var(--theme-primary)] rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          Send
        </button>
      </div>
    </div>
  )
}
