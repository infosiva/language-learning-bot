/**
 * theme.config.ts — swap to restyle LingoQuick
 * 2026 Design: Glass Tutor — deep violet, floating cards, conversational bubble UI
 */

export const theme = {
  name:    'SpeakFast',
  tagline: 'Learn faster with AI.',
  sub:     'AI tutor · 50+ languages · 6 modes · Auto flashcards — completely free',

  style: 'glass' as const,

  bg:          '#07050f',           // deep violet-black
  bgCard:      'rgba(139,92,246,0.04)',
  bgCardHover: 'rgba(139,92,246,0.08)',
  border:      'rgba(139,92,246,0.14)',
  borderHover: 'rgba(139,92,246,0.28)',

  accent1:    '#8b5cf6',           // violet — knowledge, depth
  accent2:    '#ec4899',           // pink — warmth, encouragement
  accent3:    '#06b6d4',           // cyan — clarity
  accentText: '#c4b5fd',
  accentGlow: 'rgba(139,92,246,0.20)',

  blobs: [
    { x: '30%',  y: '-20%', w: '700px', h: '500px', color: 'rgba(109,40,217,0.18)', blur: '150px' },
    { x: '-5%',  y: '60%',  w: '400px', h: '400px', color: 'rgba(236,72,153,0.10)', blur: '120px' },
  ],

  fontHeading: "'Inter', sans-serif",
  fontBody:    "'Inter', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",

  levelEmoji: { Beginner: '🌱', Intermediate: '🌿', Advanced: '🌳' },

  teasers: [
    { icon: '🔥', label: 'Start your streak' },
    { icon: '📇', label: 'Auto flashcards' },
    { icon: '🎯', label: '6 session modes' },
    { icon: '🌍', label: '50+ languages' },
  ],

  pricing: [
    {
      name: 'Free', price: '$0', sub: 'forever', highlight: false,
      features: ['20 messages / day', '50+ languages', '6 session modes', 'Auto flashcard saving', 'AI/Tech languages', 'Progress tracking'],
      cta: 'Start free',
    },
    {
      name: 'Pro', price: '$5', sub: '/month', highlight: true,
      features: ['Unlimited messages', 'Save study progress', 'Custom vocab lists', 'Grammar report cards', 'Streak rewards', 'Priority AI speed'],
      cta: 'Go Pro →',
    },
  ],

  metaTitle:       'SpeakFast — AI Language Tutor',
  metaDescription: 'Learn any language with your personal AI tutor. 50+ languages, 6 session modes, auto flashcards. 20 free messages per day.',
}

export type Theme = typeof theme
export default theme
