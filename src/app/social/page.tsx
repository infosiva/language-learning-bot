import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SpeakIQ — AI Language Tutor | Learn Spanish, French, Japanese & 50+ more',
  description: 'Practice real conversations in 50+ languages with AI. Grammar corrections, streak tracking, 7 learning modes. Free forever.',
  openGraph: {
    title: 'SpeakIQ — Talk to an AI in any language',
    description: 'Real conversation practice in 50+ languages. Grammar corrections in real-time. Free to start.',
    images: [{ url: '/og-social.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeakIQ — AI Language Tutor',
    description: 'Practice real conversations in 50+ languages. Free, no credit card.',
    images: ['/og-social.png'],
  },
}

const POSTS = [
  {
    platform: 'Twitter/X',
    icon: '𝕏',
    color: 'bg-black',
    handle: '@speakiq_app',
    time: '2h',
    text: `🧵 Most language apps are wrong about how fluency works.\n\nDuolingo, Babbel, Anki — all drill-based. Memorising words ≠ speaking.\n\nReal fluency comes from conversation under pressure.\n\nSo I built SpeakIQ — an AI that just talks to you. In 50+ languages. At your level. 👇`,
    likes: 248,
    reposts: 61,
    replies: 34,
  },
  {
    platform: 'Reddit',
    icon: '🔺',
    color: 'bg-orange-600',
    handle: 'r/languagelearning',
    time: '5h',
    text: `I built an AI conversation partner for language learners — free to try\n\nMost language apps make you do flashcard drills. That's not how humans become fluent — you need to TALK.\n\nSpeakIQ: real conversations in 50+ languages, grammar corrections in context, 7 learning modes.\n\n20 free messages/day. No credit card. Try it: speakiq.app`,
    likes: 892,
    reposts: 0,
    replies: 147,
  },
  {
    platform: 'LinkedIn',
    icon: 'in',
    color: 'bg-blue-700',
    handle: 'SpeakIQ',
    time: '1d',
    text: `Language learning is broken.\n\nAfter 2 years of Duolingo, most people still can't hold a conversation. Because drills ≠ fluency.\n\nFluency comes from actually using the language — making mistakes, getting corrected, trying again.\n\nWe built SpeakIQ: an AI conversation partner for 50+ languages that corrects your grammar in real-time, adapts to your level, and tracks your streak.\n\nFree to start. No credit card.\n\n→ speakiq.app\n\n#LanguageLearning #AI #EdTech`,
    likes: 412,
    reposts: 38,
    replies: 29,
  },
]

const STATS = [
  { label: 'Active learners', value: '2,400+' },
  { label: 'Languages', value: '50+' },
  { label: 'Learning modes', value: '7' },
  { label: 'Avg rating', value: '4.8★' },
]

export default function SocialPage() {
  return (
    <main className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a0f 100%)' }}>
      <nav className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-sm font-bold text-violet-400">← SpeakIQ</Link>
        <Link href="/pricing" className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-600 to-cyan-500">
          Start free →
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-300 mb-5">
            🌍 Speak any language. Starting now.
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Real conversations.{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              50+ languages.
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-lg mx-auto mb-8">
            AI that corrects your grammar, adapts to your level, and keeps you consistent with daily streaks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs text-white/30">
            <span className="text-yellow-400">★★★★★</span>
            <span>4.8/5 · 2,400+ learners · Free forever plan</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition text-white text-sm">
              Start learning free →
            </Link>
            <Link href="/pricing" className="px-8 py-3.5 rounded-xl font-semibold border border-white/10 text-white/60 hover:bg-white/5 transition text-sm">
              See pricing
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
              <div className="text-2xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-white/30">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Social feed */}
        <div className="mb-12">
          <h2 className="text-lg font-black text-white/60 uppercase tracking-widest mb-6 text-center text-sm">What people are saying</h2>
          <div className="space-y-4">
            {POSTS.map((post, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${post.color}`}>
                    {post.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white/80">{post.handle}</div>
                    <div className="text-xs text-white/25">{post.platform} · {post.time} ago</div>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line mb-4">{post.text}</p>
                <div className="flex gap-6 text-xs text-white/25">
                  <span>♡ {post.likes}</span>
                  {post.reposts > 0 && <span>↺ {post.reposts}</span>}
                  <span>💬 {post.replies}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
          <h3 className="text-2xl font-black mb-2">Start speaking today. It's free.</h3>
          <p className="text-white/40 text-sm mb-6">20 messages/day free. No credit card. Cancel anytime.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition text-white">
            Start learning free →
          </Link>
        </div>
      </div>
    </main>
  )
}
