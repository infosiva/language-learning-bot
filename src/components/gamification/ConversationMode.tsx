'use client'
import { useState, useRef, useEffect } from 'react'

interface Correction { original: string; fixed: string; explanation: string }
interface Turn {
  role: 'user' | 'assistant'
  content: string
  translation?: string
  corrections?: Correction[]
}

interface Props { language: string; level: string; tutorName?: string }

export function ConversationMode({ language, level, tutorName = 'Luna' }: Props) {
  const [turns,   setTurns]   = useState<Turn[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userTurn: Turn = { role: 'user', content: text }
    setTurns(prev => [...prev, userTurn])
    setLoading(true)
    try {
      const messages = [...turns, userTurn].map(t => ({ role: t.role, content: t.content }))
      const r = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, language, level, tutorName }),
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

  return (
    <div className="flex flex-col h-[500px] rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <span className="font-semibold">{tutorName}</span>
        <span className="text-xs text-[var(--text-2)] ml-auto">{language} · {level}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && (
          <p className="text-center text-[var(--text-2)] text-sm mt-8">
            Start chatting with {tutorName} in {language}!<br/>
            <span className="text-xs">You&apos;ll get instant corrections as you go.</span>
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`flex flex-col gap-1 ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
              t.role === 'user' ? 'bg-[var(--theme-primary)] text-white' : 'bg-white/10 text-white'
            }`}>
              {t.content}
            </div>
            {t.translation && <p className="text-xs text-[var(--text-2)] px-1">{t.translation}</p>}
            {t.corrections && t.corrections.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs space-y-1 max-w-xs">
                {t.corrections.map((c, ci) => (
                  <div key={ci}>
                    <span className="line-through text-red-400">{c.original}</span>
                    {' → '}
                    <span className="text-green-400">{c.fixed}</span>
                    <p className="text-[var(--text-2)] mt-0.5">{c.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-[var(--text-2)] text-sm animate-pulse">{tutorName} is typing...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Write in ${language}...`}
          className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--theme-primary)] transition-colors"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-[var(--theme-primary)] rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  )
}
