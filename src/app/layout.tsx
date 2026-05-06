import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SharedFooter from '@/components/SharedFooter'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'SpeakFast — AI Language Learning',
  description: 'Learn any language with a personalized AI tutor. Conversational lessons tailored to your level.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <SharedFooter theme="dark" />
        <script src="http://31.97.56.148:3098/t.js" data-site="language-learning-bot-blue.vercel.app" defer></script>
      </body>
    </html>
  )
}
