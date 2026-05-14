import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import SharedNavbar from '@/components/SharedNavbar'
import Footer from '../../components/Footer'
import DesignEffects from '@/components/DesignEffects'
import AnimatedBackground from '@/components/AnimatedBackground'
import type { BrandConfig } from '@/components/SharedNavbar'
import CookieConsent from "../../components/CookieConsent";

const brand: BrandConfig = {
  name: 'SpeakIQ',
  tagline: 'AI language tutor — conversational lessons tailored to your level and goals.',
  icon: 'SQ',
  color: '#7c3aed',
  url: 'https://speakiq.app',
  logoSrc: '/logo.svg',
  navLinks: [
    { label: 'Learn', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Lesson', href: '/lesson' },
    { label: 'My Path', href: '/path' },
    { label: 'Daily', href: '/daily' },
    { label: 'Badges', href: '/badges' },
    { label: 'Word Bank', href: '/wordbank' },
  ],
  cta: { label: 'Learn free →', href: '/converse' },
}

export const metadata: Metadata = {
  title: 'SpeakIQ — AI Language Learning',
  description: 'Learn any language with a personalised AI tutor. Conversational lessons, streak tracking and adaptive difficulty for rapid progress.',
  keywords: ['language learning', 'AI tutor', 'learn Spanish', 'learn French', 'language app'],
  openGraph: { title: 'SpeakIQ — AI Language Learning', description: 'Conversational AI language tutor for rapid progress.', type: 'website', locale: 'en_GB', siteName: 'SpeakIQ' },
  twitter: { card: 'summary_large_image', title: 'SpeakIQ — AI Language Learning', description: 'Learn any language with a conversational AI tutor. 50+ languages, 6 practice modes, free to start.' },
  robots: { index: true, follow: true },
}

const clerkAppearance = {
  variables: { colorPrimary: '#7c3aed', colorBackground: '#030305', colorText: '#ffffff' },
  elements: {
    formButtonPrimary: 'bg-violet-600 hover:bg-violet-700 text-white',
    card: 'bg-[#0d0d1a] border border-white/10 shadow-2xl',
    headerTitle: 'text-white',
    headerSubtitle: 'text-white/60',
    socialButtonsBlockButton: 'border-white/10 bg-white/5 hover:bg-white/10 text-white',
    formFieldInput: 'bg-white/5 border-white/10 text-white',
    footerActionLink: 'text-violet-400 hover:text-violet-300',
  },
}

const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_REPLACE_ME'
)

function MaybeClerk({ children }: { children: React.ReactNode }) {
  if (!hasClerkKeys) return <>{children}</>
  return <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaybeClerk>
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          "name": "SpeakIQ", "url": brand.url, "description": brand.tagline,
          "applicationCategory": "EducationApplication", "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" }
        })}} />
      </head>
      <body className="flex flex-col min-h-screen">
        <AnimatedBackground />
        <DesignEffects />
        <div id="layout-nav"><SharedNavbar brand={brand} /></div>
        <main className="flex-1 pt-16">{children}</main>
        <div id="layout-footer"><Footer siteName="SpeakIQ" /></div>
      <CookieConsent />
      </body>
    </html>
    </MaybeClerk>
  )
}
