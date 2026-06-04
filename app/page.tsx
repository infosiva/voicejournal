'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string
  date: string
  transcript: string
  summary: string
  mood: string
  moodEmoji: string
  insights: string[]
  tags: string[]
  affirmation: string
  wordCount: number
  duration: number
}

interface AIResult {
  summary: string
  mood: string
  moodEmoji: string
  insights: string[]
  tags: string[]
  affirmation: string
  wordCount: number
}

const STORAGE_KEY = 'voicejournal-entries'

const MOOD_COLORS: Record<string, string> = {
  Happy:      '#fbbf24',
  Reflective: '#a78bfa',
  Anxious:    '#f87171',
  Grateful:   '#34d399',
  Frustrated: '#fb923c',
  Excited:    '#f472b6',
  Sad:        '#60a5fa',
  Neutral:    '#94a3b8',
  Motivated:  '#10b981',
  Tired:      '#6b7280',
}

const STEPS = [
  { n: 1, icon: '🎙', label: 'Record', desc: 'Tap mic, speak freely' },
  { n: 2, icon: '🤖', label: 'Analyse', desc: 'AI reads your mood' },
  { n: 3, icon: '💡', label: 'Reflect', desc: 'Get personal insights' },
  { n: 4, icon: '📓', label: 'Save', desc: 'Build your journal' },
]

// ── Storage ───────────────────────────────────────────────────────────────────

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntries(entries: JournalEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* quota */ }
}

// ── Waveform ──────────────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={active ? 'wave-bar-active' : ''}
          style={{
            width: 3,
            height: active ? undefined : '25%',
            background: active ? undefined : 'rgba(255,255,255,0.12)',
            borderRadius: 99,
            alignSelf: 'center',
            minHeight: active ? '20%' : undefined,
            ...(active ? { animationDelay: `${i * 0.05}s`, height: undefined } : {}),
          }}
        />
      ))}
    </div>
  )
}

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const color = MOOD_COLORS[entry.mood] ?? '#94a3b8'
  const date = new Date(entry.date)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="entry-card glass"
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          background: 'transparent', border: 'none',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, background: `${color}18`, border: `1px solid ${color}35`,
        }}>
          {entry.moodEmoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5' }}>{dateStr}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{timeStr}</span>
            <span className="mood-tag" style={{
              background: `${color}18`, color, border: `1px solid ${color}30`, marginLeft: 'auto',
            }}>
              {entry.mood}
            </span>
          </div>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: expanded ? 999 : 1, WebkitBoxOrient: 'vertical',
          }}>
            {entry.summary}
          </p>
        </div>

        <span style={{
          fontSize: 14, color: 'rgba(255,255,255,0.2)',
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1)',
          flexShrink: 0,
        }}>›</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ padding: '12px 16px 16px' }}>
              {entry.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
                      border: '1px solid rgba(139,92,246,0.25)',
                    }}>#{tag}</span>
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                    {entry.wordCount}w · {entry.duration}s
                  </span>
                </div>
              )}

              {entry.insights.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Insights
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {entry.insights.map((ins, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 16, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#a78bfa' }}>·</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.affirmation && (
                <div style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 10,
                  background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
                }}>
                  <p style={{ fontSize: 11, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                    ✨ {entry.affirmation}
                  </p>
                </div>
              )}

              <details style={{ marginBottom: 8 }}>
                <summary style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', userSelect: 'none' }}>
                  Show transcript
                </summary>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 6 }}>
                  {entry.transcript}
                </p>
              </details>

              <button
                onClick={() => onDelete(entry.id)}
                style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.2)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'color 160ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              >
                Delete entry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Shared demo mood data ─────────────────────────────────────────────────────

const DEMO_MOODS = [
  { emoji: '😊', mood: 'Happy', color: '#fbbf24', summary: 'Feeling energised after a productive morning session.' },
  { emoji: '🤔', mood: 'Reflective', color: '#a78bfa', summary: 'Thinking through the week — lots to process and learn.' },
  { emoji: '🙏', mood: 'Grateful', color: '#34d399', summary: 'Small wins added up today. Grateful for the momentum.' },
]

// ── Mobile demo strip (shown only on mobile, replaces hidden DemoPanel) ───────

function MobileDemoStrip() {
  return (
    <div
      style={{
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        display: 'flex',
        gap: 10,
        paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {DEMO_MOODS.map((d, i) => (
        <motion.div
          key={d.mood}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="glass"
          style={{
            flexShrink: 0,
            scrollSnapAlign: 'start',
            width: 160,
            borderRadius: 14,
            padding: '12px 14px',
            border: `1px solid ${d.color}25`,
            background: `${d.color}08`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{d.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: d.color }}>{d.mood}</span>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
            {d.summary}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

// ── Demo panel (right side on desktop) ───────────────────────────────────────

function DemoPanel() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % DEMO_MOODS.length), 2800)
    return () => clearInterval(t)
  }, [])

  const d = DEMO_MOODS[activeIdx]

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow behind panel */}
      <div style={{
        position: 'absolute', inset: -24,
        background: 'radial-gradient(ellipse at 60% 40%, rgba(139,92,246,0.15) 0%, transparent 70%)',
        filter: 'blur(32px)', pointerEvents: 'none',
      }} />

      <div className="glass-strong" style={{ borderRadius: 24, padding: 24, position: 'relative' }}>
        {/* Mock mic button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 32px rgba(139,92,246,0.4)',
          }}>
            🎙
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="wave-bar-active" style={{
                width: 3, borderRadius: 99, alignSelf: 'center',
                animationDelay: `${i * 0.07}s`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            Recording… 12s
          </span>
        </div>

        {/* Animated AI result */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            style={{
              padding: '14px 16px', borderRadius: 14,
              background: `${d.color}10`, border: `1px solid ${d.color}30`,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{d.emoji}</span>
              <div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Mood detected</p>
                <p style={{ fontSize: 14, fontWeight: 900, color: d.color, margin: 0 }}>{d.mood}</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>
              {d.summary}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Insights preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Pattern noticed: morning focus peaks', 'Affirmation generated', 'Entry saved to journal'].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: 'rgba(255,255,255,0.45)',
              }}
            >
              <span style={{ color: '#a78bfa', fontSize: 14 }}>✓</span>
              {item}
            </motion.div>
          ))}
        </div>

        {/* Mood dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {DEMO_MOODS.map((m, i) => (
            <div
              key={i}
              style={{
                width: i === activeIdx ? 16 : 6,
                height: 6, borderRadius: 99,
                background: i === activeIdx ? '#8b5cf6' : 'rgba(255,255,255,0.15)',
                transition: 'width 300ms cubic-bezier(0.23,1,0.32,1), background 300ms',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Mood Wave ─────────────────────────────────────────────────────────────────

const MOOD_SCORE: Record<string, number> = {
  Happy:      90,
  Excited:    88,
  Motivated:  82,
  Grateful:   78,
  Neutral:    50,
  Reflective: 55,
  Tired:      35,
  Anxious:    28,
  Frustrated: 22,
  Sad:        18,
}

function MoodWave({ entries }: { entries: { mood: string; date: string }[] }) {
  // Build last 7 days of mood scores (most recent 7 entries or placeholders)
  const PLACEHOLDER_HEIGHTS = [45, 65, 38, 72, 55, 80, 60]
  const last7 = entries.slice(0, 7).reverse()

  const dots: { score: number; mood: string; date: string; isReal: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    if (i < last7.length) {
      const e = last7[i]
      dots.push({ score: MOOD_SCORE[e.mood] ?? 50, mood: e.mood, date: e.date, isReal: true })
    } else {
      dots.push({ score: PLACEHOLDER_HEIGHTS[i], mood: '', date: '', isReal: false })
    }
  }

  const W = 260, H = 56
  const pad = 16
  const xStep = (W - pad * 2) / 6

  // Build SVG polyline points
  const pts = dots.map((d, i) => {
    const x = pad + i * xStep
    const y = H - pad - ((d.score / 100) * (H - pad * 2))
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ margin: '20px 0 4px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        7-day mood
      </p>
      <div style={{ position: 'relative', width: W, maxWidth: '100%' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
          {/* Gradient fill */}
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Fill area */}
          <polyline
            points={`${pad},${H - pad} ${pts} ${pad + 6 * xStep},${H - pad}`}
            fill="url(#moodGrad)"
            stroke="none"
          />
          {/* Line */}
          <polyline
            points={pts}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={dots.every(d => !d.isReal) ? '4 4' : 'none'}
            opacity={dots.every(d => !d.isReal) ? 0.4 : 0.85}
          />
          {/* Dots */}
          {dots.map((d, i) => {
            const x = pad + i * xStep
            const y = H - pad - ((d.score / 100) * (H - pad * 2))
            const color = d.isReal ? (MOOD_COLORS[d.mood] ?? '#8b5cf6') : 'rgba(255,255,255,0.15)'
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={d.isReal ? 4 : 3}
                fill={color}
                stroke={d.isReal ? 'rgba(0,0,0,0.3)' : 'none'}
                strokeWidth="1.5"
                opacity={d.isReal ? 1 : 0.4}
              />
            )
          })}
        </svg>
        {/* Day labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: pad - 6, paddingRight: pad - 6, marginTop: 4 }}>
          {dots.map((d, i) => (
            <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', width: 24, textAlign: 'center' }}>
              {d.isReal
                ? new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2)
                : ['Mo','Tu','We','Th','Fr','Sa','Su'][i]
              }
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Weekly Insight Card ───────────────────────────────────────────────────────

function WeeklyInsightCard({ insight }: { insight: string }) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 12,
      background: 'rgba(139,92,246,0.07)',
      border: '1px solid rgba(139,92,246,0.2)',
      marginTop: 20,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>📊</span>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          This week&apos;s insight
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>
          {insight}
        </p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function VoiceJournal() {
  const [entries, setEntries]       = useState<JournalEntry[]>([])
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult]         = useState<AIResult | null>(null)
  const [error, setError]           = useState('')
  const [duration, setDuration]     = useState(0)
  const [view, setView]             = useState<'record' | 'history'>('record')
  const [waveKey, setWaveKey]       = useState(0)
  const [appStarted, setAppStarted] = useState(false)

  const recognitionRef = useRef<unknown>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef   = useRef<number>(0)

  useEffect(() => { setEntries(loadEntries()) }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setDuration(prev => startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : prev)
  }, [])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition requires Chrome or Edge. Type your entry below.')
      return
    }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    let finalText = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setTranscript((finalText + interim).trim())
      setWaveKey(k => k + 1)
    }
    rec.onerror = () => { setListening(false); stopTimer() }
    rec.onend   = () => { setListening(false); stopTimer() }
    recognitionRef.current = rec
    rec.start()
    setListening(true)
    setTranscript('')
    setResult(null)
    setError('')
    startTimeRef.current = Date.now()
    setDuration(0)
    timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
  }, [stopTimer])

  const stopListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(recognitionRef.current as any)?.stop()
    setListening(false)
    stopTimer()
  }, [stopTimer])

  const analyseEntry = useCallback(async (text: string) => {
    if (!text.trim()) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/voice/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Analysis failed'); return }
      setResult(json)
    } catch {
      setError('Network error — check connection and try again')
    } finally {
      setProcessing(false)
    }
  }, [])

  const saveEntry = useCallback(() => {
    if (!result || !transcript) return
    const entry: JournalEntry = {
      id: Date.now().toString(), date: new Date().toISOString(),
      transcript, duration, ...result,
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    setTranscript('')
    setResult(null)
    setDuration(0)
    setView('history')
  }, [result, transcript, entries, duration])

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    saveEntries(updated)
  }, [entries])

  const moodColor = result ? (MOOD_COLORS[result.mood] ?? '#94a3b8') : '#8b5cf6'

  const moodCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] ?? 0) + 1
    return acc
  }, {})

  // Weekly insight — rotates based on week number
  const WEEKLY_INSIGHTS = [
    'Journaling for 2+ minutes captures 3x more insight than quick notes.',
    'Most mood patterns emerge after just 5 entries — keep going!',
    'Voice journaling activates emotional processing 40% faster than typing.',
    'People who review weekly insights report 25% improved self-awareness.',
    'Your mood vocabulary grows with every entry you record.',
    'Consistent journaling for 30 days creates lasting self-reflection habits.',
    'Naming emotions reduces their intensity — science agrees.',
  ]
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const weeklyInsight = WEEKLY_INSIGHTS[weekNum % WEEKLY_INSIGHTS.length]

  // ── Hero / landing (before user starts) ────────────────────────────────────
  if (!appStarted) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>

        {/* Hero split */}
        <section style={{
          flex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          padding: '32px 20px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr)',
          gap: 40,
          alignItems: 'center',
        }}
          className="hero-grid"
        >
          <style>{`
            .demo-panel-desktop { display: none; }
            @media (min-width: 1024px) {
              .hero-grid { grid-template-columns: 1fr 1fr !important; }
              .demo-strip-mobile { display: none !important; }
              .demo-panel-desktop { display: block !important; }
            }
          `}</style>

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 9999, marginBottom: 24,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
              fontSize: 11, color: 'rgba(196,181,253,0.82)', fontWeight: 700,
              letterSpacing: '0.11em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 8px #a78bfa' }} />
              FREE AI JOURNALING
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.97,
              color: '#f4f4f5',
              margin: '0 0 18px',
            }}>
              Speak for 2 minutes.<br />
              <span style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 28px rgba(139,92,246,0.45))',
              }}>Your AI journal writes itself,</span> tracks your mood, and spots what&apos;s changing.
            </h1>

            {/* Mobile demo strip — between headline and paragraph, above fold */}
            <div className="demo-strip-mobile" style={{ marginBottom: 20 }}>
              <MobileDemoStrip />
            </div>

            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
              margin: '0 0 24px',
              maxWidth: 440,
            }}>
              Record voice notes, get AI mood analysis, personal insights, and daily affirmations — all stored privately in your browser.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => setAppStarted(true)}
                style={{ fontSize: 15, padding: '14px 32px' }}
              >
                Start journaling →
              </button>
              <button
                className="btn-ghost"
                onClick={() => { setAppStarted(true); setView('history') }}
                style={{ fontSize: 14, padding: '14px 24px' }}
              >
                View journal ({entries.length})
              </button>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
              {['🎙 Voice or text', '🤖 AI mood detect', '🔒 Stored locally', '✨ Daily affirmation'].map(pill => (
                <span key={pill} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '4px 10px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — animated demo (desktop only) */}
          <motion.div
            className="demo-panel-desktop"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <DemoPanel />
          </motion.div>
        </section>

        {/* Steps row — 4-col on all viewports */}
        <section style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '0 24px 40px',
          width: '100%',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 10,
          }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="glass"
                style={{ borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}
              >
                <div className="step-badge" style={{ margin: '0 auto 8px' }}>{s.n}</div>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{s.icon}</div>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#f4f4f5', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features section */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px', width: '100%' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(139,92,246,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 24px', lineHeight: 1.15 }}>
            Everything your journal needs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {[
              { icon: '🎙', title: 'Voice or text input', desc: 'Speak freely or type — browser Speech API with no upload required.' },
              { icon: '🤖', title: 'AI mood detection', desc: 'Detects 10 emotion states from Happy to Frustrated in seconds.' },
              { icon: '💡', title: 'Personal insights', desc: 'AI surfaces patterns in your language you might not notice yourself.' },
              { icon: '✨', title: 'Daily affirmations', desc: 'Each entry ends with a personalised affirmation based on your words.' },
              { icon: '📊', title: '7-day mood chart', desc: 'Visual mood wave so you can see patterns across the week.' },
              { icon: '🔒', title: 'Private by default', desc: 'Entries stored locally in your browser — nothing sent to a server.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="glass"
                style={{ borderRadius: 16, padding: '18px 16px' }}
              >
                <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#f4f4f5', margin: '0 0 6px' }}>{f.title}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing section */}
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(139,92,246,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 20px', lineHeight: 1.15 }}>
            Free forever. Upgrade when you want more.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {/* Free plan */}
            <div className="glass" style={{ borderRadius: 20, padding: '24px' }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#f4f4f5', margin: '0 0 4px' }}>Free</p>
              <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', color: '#f4f4f5', margin: '0 0 20px' }}>
                $0 <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>forever</span>
              </p>
              {['Voice + text journaling', 'AI mood detection', 'Personal insights', 'Daily affirmations', 'Stored locally in browser', '7-day mood chart'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 900 }}>✓</span> {f}
                </div>
              ))}
              <button
                onClick={() => setAppStarted(true)}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', fontSize: 13, marginTop: 16 }}
              >
                Start journaling →
              </button>
            </div>
            {/* Pro plan */}
            <div style={{ borderRadius: 20, padding: '24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(109,40,217,0.15) 100%)', border: '1px solid rgba(139,92,246,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: '#f4f4f5', margin: 0 }}>Pro</p>
                <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: '#10b981', color: '#fff' }}>COMING SOON</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', color: '#f4f4f5', margin: '0 0 20px' }}>
                $4 <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/ month</span>
              </p>
              {['Everything in Free', 'Cloud backup & sync', 'Export journal as PDF', 'Advanced mood trends', 'Weekly AI review email', 'Priority support'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 900 }}>✓</span> {f}
                </div>
              ))}
              <button
                onClick={() => setAppStarted(true)}
                style={{
                  width: '100%', padding: '11px', fontSize: 13, fontWeight: 700,
                  marginTop: 16, borderRadius: 12,
                  background: 'rgba(255,255,255,0.9)', color: '#7c3aed',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 150ms, transform 100ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Join waitlist →
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // ── App view ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 100px' }}>

      {/* Back to landing + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setAppStarted(false)}
          style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'color 160ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          ← Home
        </button>
        <div style={{ flex: 1 }} />
        {(['record', 'history'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`btn-tab ${view === v ? 'active' : 'inactive'}`}
            style={{ fontSize: 12, padding: '7px 16px', border: 'unset' }}
          >
            {v === 'record' ? '🎙 Record' : `📓 Journal (${entries.length})`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── RECORD VIEW ── */}
        {view === 'record' && (
          <motion.div
            key="record"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Record hero */}
            <div className="glass" style={{ borderRadius: 24, padding: '36px 24px', textAlign: 'center' }}>
              <button
                onClick={listening ? stopListening : startListening}
                disabled={processing}
                className={`btn-record ${listening ? 'listening' : processing ? 'processing' : 'idle'}`}
                style={{ width: 88, height: 88, fontSize: 32, margin: '0 auto 16px' }}
                aria-label={listening ? 'Stop recording' : 'Start recording'}
              >
                {processing ? '⏳' : listening ? '⏹' : '🎙'}
              </button>

              <p style={{ fontSize: 14, fontWeight: 700, color: listening ? '#c4b5fd' : 'rgba(255,255,255,0.45)', margin: '0 0 6px' }}>
                {listening ? `Recording… ${duration}s` : processing ? 'Analysing…' : 'Tap to record'}
              </p>
              {listening && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '0 0 12px' }}>
                  Tap again to stop
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Waveform key={waveKey} active={listening} />
              </div>
            </div>

            {/* Live transcript */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="glass"
                  style={{ borderRadius: 16, padding: '14px 16px', overflow: 'hidden' }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Transcript
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                    {transcript}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text fallback */}
            {!listening && !transcript && !result && (
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>Or type your entry:</p>
                <textarea
                  placeholder="What's on your mind today?"
                  onChange={e => setTranscript(e.target.value)}
                  className="glass"
                  style={{
                    width: '100%', minHeight: 100, padding: '12px 14px',
                    borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                    color: '#f4f4f5',
                  }}
                />
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: 12, color: '#f87171',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    padding: '10px 14px', borderRadius: 10, margin: 0,
                  }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Analyse CTA */}
            {transcript && !listening && !result && (
              <button
                className="btn-primary"
                onClick={() => analyseEntry(transcript)}
                disabled={processing}
                style={{ width: '100%', padding: '14px', fontSize: 14 }}
              >
                {processing ? 'Analysing…' : '✨ Analyse my entry'}
              </button>
            )}

            {/* AI result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {/* Mood + summary */}
                  <div style={{
                    padding: '16px', borderRadius: 18,
                    background: `${moodColor}10`, border: `1px solid ${moodColor}30`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{result.moodEmoji}</span>
                      <div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Mood detected</p>
                        <p style={{ fontSize: 16, fontWeight: 900, color: moodColor, margin: 0 }}>{result.mood}</p>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                        {result.wordCount} words
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                      {result.summary}
                    </p>
                  </div>

                  {/* Insights */}
                  <div className="glass" style={{ padding: '14px 16px', borderRadius: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Insights
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.insights.map((ins, i) => (
                        <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', paddingLeft: 18, position: 'relative', lineHeight: 1.5 }}>
                          <span style={{ position: 'absolute', left: 0, color: '#a78bfa', fontWeight: 900 }}>·</span>
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {result.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                          background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
                          border: '1px solid rgba(139,92,246,0.25)',
                        }}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Affirmation */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 14,
                    background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
                  }}>
                    <p style={{ fontSize: 12, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                      ✨ {result.affirmation}
                    </p>
                  </div>

                  {/* Save / discard */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn-primary"
                      onClick={saveEntry}
                      style={{ flex: 1, padding: '13px', fontSize: 14 }}
                    >
                      Save to journal
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => { setResult(null); setTranscript('') }}
                      style={{ padding: '13px 20px', fontSize: 13 }}
                    >
                      Discard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>📓</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>No entries yet</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 24 }}>Record your first voice note to get started</p>
                <button
                  className="btn-primary"
                  onClick={() => setView('record')}
                  style={{ padding: '11px 28px', fontSize: 13 }}
                >
                  Record now →
                </button>
              </div>
            ) : (
              <>
                {/* 7-day mood wave */}
                <div className="glass" style={{ borderRadius: 16, padding: '16px 18px', marginBottom: 4 }}>
                  <MoodWave entries={entries} />
                  <WeeklyInsightCard insight={weeklyInsight} />
                </div>

                {/* Mood strip */}
                <div className="glass" style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6,
                  padding: '12px 14px', borderRadius: 14, marginBottom: 4,
                }}>
                  {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
                    <span key={mood} className="mood-tag" style={{
                      background: `${MOOD_COLORS[mood] ?? '#94a3b8'}18`,
                      color: MOOD_COLORS[mood] ?? '#94a3b8',
                      border: `1px solid ${MOOD_COLORS[mood] ?? '#94a3b8'}30`,
                    }}>
                      {mood} ×{count}
                    </span>
                  ))}
                </div>

                {entries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
