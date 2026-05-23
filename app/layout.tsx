import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import BackToTop from '@/components/BackToTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-voice-home.vercel.app'),
  title: 'VoiceJournal — AI Voice Diary & Mood Tracking',
  description: 'Record your thoughts by voice. AI transcribes, analyzes your mood, and surfaces personal insights from daily reflections. Free AI voice journaling.',
  keywords: ['voice journal', 'AI diary', 'mood tracking', 'voice notes', 'reflection', 'journaling app'],
  openGraph: {
    title: 'VoiceJournal — AI Voice Diary & Mood Tracking',
    description: 'Voice-based journaling with AI mood analysis and personalized insights. Free to use.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoiceJournal — AI Voice Diary',
    description: 'Speak your thoughts. AI reflects them back.',
    images: ['/og.png'],
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
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full antialiased`}>
        {/* Aurora blobs */}
        <div className="aurora aurora-primary" aria-hidden />
        <div className="aurora aurora-secondary" aria-hidden />
        <div className="aurora aurora-third" aria-hidden />
        <div className="grain" aria-hidden />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <Navbar />
          {children}
        </div>

        <FloatingChatWrapper />
        <BackToTop accentColor="#8b5cf6" />
      </body>
    </html>
  )
}
