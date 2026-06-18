import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'
import FeedbackWidget from '@/components/FeedbackWidget'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import BackToTop from '@/components/BackToTop'
import { loadSiteTheme, buildThemeStyleTag } from '@/lib/theme-loader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://voicejournal.app'),
  title: 'VoiceJournal — AI Voice Diary & Mood Tracking App',
  description: 'Speak for 2 minutes — AI transcribes your voice, detects your mood, and surfaces personal insights. Free voice journaling with privacy-first local storage.',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await loadSiteTheme('voicejournal')
  const themeStyle = buildThemeStyleTag(theme, {
    background: '#f5f0ff',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
  })

  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4237294630161176" />
        {themeStyle && (
          <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        )}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "VoiceJournal",
              "url": "https://voicejournal.app",
              "description": "AI-powered voice journaling and mood analysis app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://voicejournal.app"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full antialiased`} style={{ background: 'var(--background, #f5f0ff)' }}>
        <Navbar />
        {children}
        <FloatingChatWrapper />
        <FeedbackWidget siteName="VoiceJournal" accentColor="#8b5cf6" accentColor2="#7c3aed" position="left" />
        <BackToTop accentColor="#8b5cf6" />
        <Script defer data-site="ai-voice-home.vercel.app" src="http://31.97.56.148:3098/t.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
