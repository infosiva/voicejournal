'use client'
import { useEffect, useState } from 'react'

interface Stats { entriesRecorded: number; minutesTranscribed: number; insightsGenerated: number }

export default function LiveStatsBar() {
  const [stats, setStats] = useState<Stats>({ entriesRecorded: 0, minutesTranscribed: 0, insightsGenerated: 0 })

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  if (!stats.entriesRecorded && !stats.minutesTranscribed && !stats.insightsGenerated) return null

  return (
    <div className="border-y py-3 px-5" style={{ background: 'var(--surface-2,#f5f0ff)', borderColor: 'var(--border,#ddd6fe)' }}>
      <div className="mx-auto flex max-w-5xl justify-center gap-8 flex-wrap">
        {stats.entriesRecorded > 0 && (
          <div className="text-center">
            <span className="block text-[20px] font-black" style={{ color: 'var(--accent,#8b5cf6)' }}>{stats.entriesRecorded}</span>
            <span className="text-[11px] text-slate-500">entries recorded this session</span>
          </div>
        )}
        {stats.insightsGenerated > 0 && (
          <div className="text-center">
            <span className="block text-[20px] font-black" style={{ color: 'var(--accent,#8b5cf6)' }}>{stats.insightsGenerated}</span>
            <span className="text-[11px] text-slate-500">insights generated</span>
          </div>
        )}
      </div>
    </div>
  )
}
