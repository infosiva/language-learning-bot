import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import SharedNavbar from '@/components/SharedNavbar'
import Footer from '../../components/Footer'
import DesignEffects from '@/components/DesignEffects'
import AnimatedBackground from '@/components/AnimatedBackground'
import ChatBot from '@/components/ChatBot'
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
  openGraph: { title: 'SpeakIQ — AI Language Learning', description: 'Conversational AI language tutor for rapid progress.', type: 'website', locale: 'en_GB', siteName: 'SpeakIQ', images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'SpeakIQ — AI Language Learning' }] },
  twitter: { card: 'summary_large_image', title: 'SpeakIQ — AI Language Learning', description: 'Learn any language with a conversational AI tutor. 50+ languages, 6 practice modes, free to start.', images: ['/og.svg'] },
  robots: { index: true, follow: true },
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#7c3aed',
    colorBackground: '#1c1830',
    colorText: '#ffffff',
    colorTextSecondary: '#9ca3af',
    colorInputBackground: '#2a2545',
    colorInputText: '#ffffff',
    colorNeutral: '#ffffff',
    colorShimmer: '#7c3aed',
    borderRadius: '12px',
    fontSize: '15px',
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
        <meta name="Impact-Site-Verification" content="cec1d783-d697-4f52-a52f-2677e900984f" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --theme-primary: #4f46e5;
            --theme-secondary: #818cf8;
            --theme-base: #0d0b1e;
            --background: #0d0b1e;
            --surface-1: #13112a;
            --surface-2: #1a1840;
            --foreground: #eef2ff;
            --text-2: #a5b4fc;
            --border-default: rgba(99,102,241,0.15);
            --border-strong: rgba(99,102,241,0.25);
            --radius: 1rem;
            --radius-lg: 1.5rem;
            --radius-xl: 2rem;
          }
          body { font-family: 'DM Sans', system-ui, sans-serif !important; }
          h1, h2, h3, .display { font-family: 'Nunito', sans-serif !important; }
          .glass {
            background: rgba(13,11,30,0.65) !important;
            border-color: rgba(99,102,241,0.12) !important;
          }
        `}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          "name": "SpeakIQ", "url": brand.url, "description": brand.tagline,
          "applicationCategory": "EducationApplication", "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" }
        })}} />
      </head>
      <body className="flex flex-col min-h-screen">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4237294630161176"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AnimatedBackground />
        <DesignEffects />
        <div id="layout-nav"><SharedNavbar brand={brand} /></div>
        <main className="flex-1 pt-16">{children}</main>
        <div id="layout-footer" className="relative z-10 bg-[#05030a]"><Footer siteName="SpeakIQ" tagline="AI language tutor — 50+ languages, no account needed." /></div>
      <ChatBot />
      <CookieConsent />
        <Script src="http://31.97.56.148:3098/t.js" data-site="speakiq.app" strategy="afterInteractive" />
      </body>
    </html>
    </MaybeClerk>
  )
}
