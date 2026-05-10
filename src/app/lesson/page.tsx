'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Volume2, MessageSquare, ChevronDown, ChevronUp, Loader2, Sparkles, Copy, CheckCircle } from 'lucide-react'

interface VocabItem {
  word: string
  pronunciation: string
  translation: string
  example: string
  exampleTranslation: string
}
interface Grammar {
  rule: string
  explanation: string
  pattern: string
  examples: string[]
}
interface Phrase {
  phrase: string
  translation: string
  context: string
}
interface Lesson {
  title: string
  objective: string
  vocab: VocabItem[]
  grammar: Grammar
  phrases: Phrase[]
  culturalNote: string
  practicePrompt: string
}

const COMMON_TOPICS: Record<string, string[]> = {
  Beginner: ['Greetings & Introductions', 'Numbers & Counting', 'Days & Months', 'Food & Drinks', 'Family Members', 'Colors & Shapes', 'Common Verbs'],
  Intermediate: ['Describing Places', 'Past Tense Narration', 'Shopping & Money', 'Health & Body', 'Weather & Nature', 'Travel & Directions', 'Emotions & Feelings'],
  Advanced: ['Business Communication', 'Idioms & Expressions', 'News & Current Events', 'Formal Writing', 'Debate & Opinion', 'Literature & Culture', 'Slang & Colloquial'],
}

export default function LessonPage() {
  const [language, setLanguage] = useState('')
  const [level, setLevel]       = useState('')
  const [topic, setTopic]       = useState('')
  const [lesson, setLesson]     = useState<Lesson | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)
  const [openVocab, setOpenVocab] = useState<number | null>(null)
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set())

  // Load saved lang/level from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('speakfast-prefs')
    if (saved) {
      const p = JSON.parse(saved)
      setLanguage(p.language ?? '')
      setLevel(p.level ?? '')
    }
  }, [])

  async function generateLesson() {
    if (!language || !level) return
    setLoading(true)
    setError('')
    setLesson(null)
    try {
      const r = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, level, topic, native: 'English' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed')
      setLesson(data.lesson)
      // Save progress
      const today = new Date().toISOString().split('T')[0]
      const history = JSON.parse(localStorage.getItem('speakfast-lessons') ?? '[]')
      history.unshift({ language, level, topic: data.lesson.title, date: today })
      localStorage.setItem('speakfast-lessons', JSON.stringify(history.slice(0, 20)))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyPracticePrompt() {
    if (!lesson) return
    navigator.clipboard.writeText(lesson.practicePrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleKnown(word: string) {
    setKnownWords(prev => {
      const next = new Set(prev)
      next.has(word) ? next.delete(word) : next.add(word)
      const arr = Array.from(next)
      localStorage.setItem('speakfast-known', JSON.stringify(arr))
      return next
    })
  }

  const topics = COMMON_TOPICS[level] ?? COMMON_TOPICS.Beginner

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px', maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          <MessageSquare size={14} /> Practice in Chat
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <BookOpen size={22} style={{ color: '#6366f1' }} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>Structured Lesson</h1>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>AI generates a full lesson: vocab, grammar, phrases, cultural notes</p>
      </div>

      {/* Config form */}
      <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Language</label>
            <input
              value={language}
              onChange={e => setLanguage(e.target.value)}
              placeholder="e.g. Spanish, Japanese..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Level</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="">Select level</option>
              {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Topic chips */}
        {level && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Topic (optional)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topics.map(t => (
                <button key={t} onClick={() => setTopic(topic === t ? '' : t)}
                  style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: topic === t ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                    color: topic === t ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                    outline: topic === t ? '1px solid rgba(99,102,241,0.5)' : 'none' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={generateLesson}
          disabled={!language || !level || loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: loading || !language || !level ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 15, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', opacity: !language || !level ? 0.5 : 1, transition: 'opacity 0.2s' }}
        >
          {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating lesson…</> : <><Sparkles size={16} /> Generate Lesson</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 14, marginBottom: 20 }}>{error}</div>
      )}

      {/* Lesson content */}
      {lesson && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title + objective */}
          <div style={{ padding: '20px 24px', borderRadius: 16, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{lesson.title}</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>🎯 {lesson.objective}</p>
          </div>

          {/* Vocabulary */}
          <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>📚</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Vocabulary ({lesson.vocab.length} words)</h3>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{knownWords.size} known</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lesson.vocab.map((v, i) => (
                <div key={i}
                  style={{ borderRadius: 12, border: `1px solid ${knownWords.has(v.word) ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`, background: knownWords.has(v.word) ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setOpenVocab(openVocab === i ? null : i)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{v.word}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'serif' }}>{v.pronunciation}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{v.translation}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); toggleKnown(v.word) }}
                        style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                          background: knownWords.has(v.word) ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                          color: knownWords.has(v.word) ? '#6ee7b7' : 'rgba(255,255,255,0.4)' }}>
                        {knownWords.has(v.word) ? '✓ Known' : 'Mark known'}
                      </button>
                      {openVocab === i ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    </div>
                  </div>
                  {openVocab === i && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: 14, color: '#a5b4fc', margin: '10px 0 2px', fontStyle: 'italic' }}>{v.example}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{v.exampleTranslation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grammar */}
          <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>📐</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Grammar: {lesson.grammar.rule}</h3>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 0 14px' }}>{lesson.grammar.explanation}</p>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pattern: </span>
              <span style={{ fontSize: 14, color: '#c7d2fe', fontFamily: 'monospace' }}>{lesson.grammar.pattern}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lesson.grammar.examples.map((ex, i) => {
                const [target, eng] = ex.split(' — ')
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{target}</p>
                      {eng && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{eng}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Useful phrases */}
          <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Useful Phrases</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lesson.phrases.map((p, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{p.phrase}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{p.translation}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{p.context}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cultural note */}
          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🌍 Cultural Note</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>{lesson.culturalNote}</p>
          </div>

          {/* Practice CTA */}
          <div style={{ padding: '20px 24px', borderRadius: 16, background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(20,184,166,0.06))', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>🎯 Practice This Lesson</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px', lineHeight: 1.6 }}>Copy this prompt and paste it into the chat to practice what you just learned:</p>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', lineHeight: 1.6, marginBottom: 14 }}>
              {lesson.practicePrompt}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={copyPracticePrompt}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy prompt</>}
              </button>
              <Link href="/"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                <MessageSquare size={14} /> Open chat
              </Link>
            </div>
          </div>

        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
