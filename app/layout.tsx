import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'
import Script from 'next/script'
import BackToTop from '@/components/BackToTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-voice-home.vercel.app'),
  title: 'VoiceJournal — AI Voice Diary & Personal Reflection Tool',
  description: 'Record your thoughts by voice. AI transcribes, analyzes mood, and gives insights from your daily reflections. Free voice journaling.',
  keywords: ['voice journal', 'AI diary', 'mood tracking', 'voice notes', 'reflection', 'journaling app'],
  openGraph: {
    title: 'VoiceJournal — AI Voice Diary',
    description: 'Voice-based journaling with AI mood analysis and personalized insights',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "VoiceJournal",
              "description": "AI-powered voice journaling and mood analysis app",
              "applicationCategory": "HealthAndFitnessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full antialiased`} style={{ background: '#07010f', color: '#f4f4f5' }}>
        {children}
        <FloatingChatWrapper />
        <BackToTop accentColor="#8b5cf6" />
      </body>
    </html>
  )
}
