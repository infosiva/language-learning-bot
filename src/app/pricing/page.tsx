import type { Metadata } from 'next'
import Link from 'next/link'
import NewsletterForm from '@/components/NewsletterForm'

export const metadata: Metadata = {
  title: 'Pricing — SpeakIQ | AI Language Tutor',
  description: 'Start learning languages for free. Upgrade to Pro for $7/mo — unlimited conversations, grammar reports, and priority AI speed.',
  openGraph: {
    title: 'SpeakIQ Pricing — Free AI Language Tutor',
    description: 'Free forever plan with 20 messages/day. Pro at $7/mo for unlimited practice in 50+ languages.',
  },
}

const FREE_FEATURES = [
  '20 messages/day',
  '50+ languages',
  '7 learning modes',
  'Auto flashcards',
  'Streak tracking',
]

const PRO_FEATURES = [
  'Unlimited messages',
  'Grammar reports',
  'Progress saved forever',
  'Priority AI speed',
  'All 7 modes unlocked',
  'Interview prep mode',
]

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel from your dashboard, no questions asked. You keep Pro access until end of billing period.',
  },
  {
    q: 'What languages are supported?',
    a: '50+ languages including Spanish, French, Japanese, Mandarin, Hindi, Arabic, Portuguese, German, Italian and more.',
  },
  {
    q: 'How does the AI work?',
    a: 'Powered by Claude and Groq LLMs — real conversation practice with grammar correction and cultural context.',
  },
  {
    q: 'Is the free plan really free forever?',
    a: 'Yes. No credit card required. Free plan gives you 20 AI messages per day — enough for a solid daily practice session.',
  },
  {
    q: 'What is the refund policy?',
    a: 'We offer a 7-day money-back guarantee. If you\'re not happy, email us and we\'ll refund immediately.',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a0f 100%)' }}>
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition">← SpeakIQ</Link>
        <Link href="/?upgrade=true" className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition">
          Start Pro →
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-300 mb-6">
            ⚡ Simple pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Learn languages with AI.{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Start free.
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            No drills. Real conversations in 50+ languages. Upgrade only when you need more.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
          {/* Free */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-white/25 mb-2">Free</div>
            <div className="text-5xl font-black text-white/40 mb-1">$0</div>
            <div className="text-xs text-white/20 mb-8">forever</div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/40">
                  <span className="text-white/20">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/" className="block w-full py-3 rounded-xl text-center text-sm font-semibold border border-white/10 text-white/40 hover:bg-white/5 transition">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-violet-500/50 bg-violet-950/30 p-8 relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
              Most Popular
            </span>
            <div className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Pro</div>
            <div className="text-5xl font-black text-white mb-1">$7</div>
            <div className="text-xs text-violet-500 mb-8">/month · cancel anytime</div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-violet-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/?upgrade=true" className="block w-full py-3 rounded-xl text-center text-sm font-bold bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition text-white">
              Start Pro — $7/mo →
            </Link>
            <p className="text-[10px] text-center text-white/25 mt-3">7-day money-back guarantee</p>
          </div>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/30 mb-20">
          <span>50+ languages</span>
          <span>·</span>
          <span>No credit card for free plan</span>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-1">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group border-b border-white/[0.06] py-4">
                <summary className="cursor-pointer font-semibold text-sm text-white/70 group-open:text-white transition list-none flex items-center justify-between">
                  {q}
                  <span className="text-white/30 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-white/40 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <p className="text-white/30 text-sm mb-4">Still not sure? Start free — no credit card needed.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition text-white">
            Start learning free →
          </Link>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/[0.06] mt-20 pt-12 text-center">
          <p className="text-white/50 text-sm font-medium mb-1">Get weekly language learning tips</p>
          <p className="text-white/25 text-xs mb-6">No spam. Unsubscribe anytime.</p>
          <NewsletterForm accentClass="from-violet-600 to-cyan-500" />
        </div>
      </div>
    </main>
  )
}
