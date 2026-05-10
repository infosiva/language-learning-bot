import type { Metadata } from 'next'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import SharedFooter from '@/components/SharedFooter'
import DesignEffects from '@/components/DesignEffects'
import AnimatedBackground from '@/components/AnimatedBackground'
import type { BrandConfig } from '@/components/SharedNavbar'

const brand: BrandConfig = {
  name: 'SpeakIQ',
  tagline: 'AI language tutor — conversational lessons tailored to your level and goals.',
  icon: '🗣️',
  color: '#f97316',
  url: 'https://speakiq.app',
  navLinks: [{ label: 'Start learning', href: '/' }, { label: 'Structured Lesson', href: '/lesson' }, { label: 'Languages', href: '/?tab=languages' }],
  cta: { label: 'Learn free →', href: '/' },
}

export const metadata: Metadata = {
  title: 'SpeakIQ — AI Language Learning',
  description: 'Learn any language with a personalised AI tutor. Conversational lessons, streak tracking and adaptive difficulty for rapid progress.',
  keywords: ['language learning', 'AI tutor', 'learn Spanish', 'learn French', 'language app'],
  openGraph: { title: 'SpeakIQ — AI Language Learning', description: 'Conversational AI language tutor for rapid progress.', type: 'website', locale: 'en_GB', siteName: 'SpeakIQ' },
  twitter: { card: 'summary_large_image', title: 'SpeakIQ', description: 'AI language learning app.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <SharedFooter brand={brand} />
      </body>
    </html>
  )
}
