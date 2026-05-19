import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VoiceJournal — AI Voice Diary',
  description: 'Record your thoughts by voice. AI transcribes, analyses mood, and gives insights from your daily reflections.',
  keywords: ['voice journal', 'AI diary', 'mood tracking', 'voice notes', 'reflection'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full antialiased`} style={{ background: '#07010f', color: '#f4f4f5' }}>
        {children}
        <FloatingChatWrapper />
      </body>
    </html>
  )
}
