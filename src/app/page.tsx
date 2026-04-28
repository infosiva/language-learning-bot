'use client'
import { useState, useRef, useEffect } from 'react'

const LANGUAGES = ['Spanish', 'French', 'Japanese', 'Mandarin', 'German', 'Italian', 'Portuguese', 'Korean', 'Arabic', 'Hindi']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

interface Message { role: 'user' | 'assistant'; content: string }

export default function Home() {
  const [setup, setSetup] = useState(true)
  const [language, setLanguage] = useState('Spanish')
  const [native, setNative] = useState('English')
  const [level, setLevel] = useState('Beginner')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function startChat() {
    setSetup(false)
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello! Please introduce yourself and start our first lesson.', language, native, level, history: [] }),
    })
    const data = await res.json()
    setMessages([{ role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMsgs)
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, language, native, level, history: messages }),
    })
    const data = await res.json()
    setMessages([...newMsgs, { role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  if (setup) return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/15 blur-[130px]" />
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl mx-auto mb-4">🗣️</div>
          <h1 className="text-4xl font-bold mb-2">SpeakFast</h1>
          <p className="text-white/50">Your AI language tutor. Personalized lessons, instant feedback.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 space-y-6" style={{ boxShadow: '0 0 40px rgba(139,92,246,0.1)' }}>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">I want to learn</label>
            <div className="grid grid-cols-5 gap-2">
              {LANGUAGES.map(l => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${language === l ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">My level</label>
            <div className="flex gap-3">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${level === l ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">My native language</label>
            <input value={native} onChange={e => setNative(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all" />
          </div>

          <button onClick={startChat}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 font-bold text-base transition-all shadow-lg shadow-violet-500/20">
            Start learning {language} →
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-violet-600/10 blur-[130px]" />
      </div>

      {/* Chat nav */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm">🗣️</div>
            <div>
              <div className="font-semibold text-sm">{language} Tutor</div>
              <div className="text-xs text-white/40">{level} · {native} speaker</div>
            </div>
          </div>
          <button onClick={() => { setSetup(true); setMessages([]) }} className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Change language
          </button>
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
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-600/30 border border-violet-500/30 text-white rounded-tr-sm'
                  : 'bg-white/[0.05] border border-white/8 text-white/90 rounded-tl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm mr-3 flex-shrink-0">✦</div>
              <div className="bg-white/[0.05] border border-white/8 rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/5 bg-black/20 backdrop-blur-xl p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Reply in ${language} or ask a question...`}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all"
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 font-semibold text-sm transition-all disabled:opacity-40">
            Send
          </button>
        </div>
      </div>
    </main>
  )
}
