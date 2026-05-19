'use client'
import { motion } from 'framer-motion'

import { useState, useRef, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string
  date: string        // ISO string
  transcript: string
  summary: string
  mood: string
  moodEmoji: string
  insights: string[]
  tags: string[]
  affirmation: string
  wordCount: number
  duration: number    // seconds
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

// ── Storage helpers ──────────────────────────────────────────────────────────

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntries(entries: JournalEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* quota */ }
}

// ── Waveform bars ────────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
{/* Animated blob bg */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }} aria-hidden>
        <motion.div
          style={{ position: 'absolute', top: '-15%', left: '-8%', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 70%)', filter: 'blur(80px)' }}
          animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
          style={{ position: 'absolute', bottom: '-10%', right: '-6%', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2,132,199,0.10) 0%, transparent 70%)', filter: 'blur(90px)' }}
          animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
        />
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: active ? `${20 + Math.random() * 60}%` : '25%',
            background: active ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.15)',
            borderRadius: 99,
            transition: active ? `height ${0.1 + i * 0.05}s ease-in-out` : 'height 0.3s',
          }}
        />
      ))}
    </div>
  )
}

// ── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const color = MOOD_COLORS[entry.mood] ?? '#94a3b8'
  const date = new Date(entry.date)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.025)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          background: 'transparent', border: 'none',
        }}
      >
        {/* Mood emoji circle */}
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
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
              background: `${color}18`, color, border: `1px solid ${color}30`,
              marginLeft: 'auto',
            }}>
              {entry.mood}
            </span>
          </div>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: expanded ? 999 : 1,
            WebkitBoxOrient: 'vertical',
          }}>
            {entry.summary}
          </p>
        </div>

        <span style={{
          fontSize: 14, color: 'rgba(255,255,255,0.25)',
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }}>›</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12, marginBottom: 12 }}>
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

          {/* Insights */}
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

          {/* Affirmation */}
          {entry.affirmation && (
            <div style={{
              padding: '10px 12px', borderRadius: 10, marginBottom: 10,
              background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <p style={{ fontSize: 11, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.5 }}>
                ✨ {entry.affirmation}
              </p>
            </div>
          )}

          {/* Transcript toggle */}
          <details style={{ marginBottom: 8 }}>
            <summary style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', userSelect: 'none' }}>
              Show transcript
            </summary>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 6 }}>
              {entry.transcript}
            </p>
          </details>

          {/* Delete */}
          <button
            onClick={() => onDelete(entry.id)}
            style={{
              fontSize: 10, color: 'rgba(255,255,255,0.2)', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Delete entry
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function VoiceJournal() {
  const [entries, setEntries]       = useState<JournalEntry[]>([])
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult]         = useState<AIResult | null>(null)
  const [error, setError]           = useState('')
  const [duration, setDuration]     = useState(0)
  const [view, setView]             = useState<'record' | 'history'>('record')
  const [waveKey, setWaveKey]       = useState(0) // force re-render for waveform animation

  const recognitionRef = useRef<unknown>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef   = useRef<number>(0)

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setDuration(prev => {
      if (startTimeRef.current) {
        return Math.floor((Date.now() - startTimeRef.current) / 1000)
      }
      return prev
    })
  }, [])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition requires Chrome or Edge. Or type your entry below.')
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
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setTranscript((finalText + interim).trim())
      setWaveKey(k => k + 1) // re-trigger waveform
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
      id:          Date.now().toString(),
      date:        new Date().toISOString(),
      transcript,
      duration,
      ...result,
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

  // Mood distribution for history view
  const moodCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
          🎙 VoiceJournal
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Speak your thoughts. AI reflects them back.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {(['record', 'history'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              border: view === v ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
              background: view === v ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: view === v ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
          >
            {v === 'record' ? '🎙 Record' : `📓 Journal (${entries.length})`}
          </button>
        ))}
      </div>

      {/* ── RECORD VIEW ── */}
      {view === 'record' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Big record button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
            <button
              onClick={listening ? stopListening : startListening}
              disabled={processing}
              className={listening ? 'recording-pulse' : ''}
              style={{
                width: 96, height: 96, borderRadius: '50%',
                border: 'none', cursor: processing ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
                background: listening
                  ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                  : processing
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                boxShadow: listening ? '0 0 32px rgba(139,92,246,0.4)' : '0 4px 24px rgba(139,92,246,0.2)',
                transition: 'all 0.2s',
              }}
            >
              {processing ? '⏳' : listening ? '⏹' : '🎙'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: listening ? '#c4b5fd' : 'rgba(255,255,255,0.5)', margin: 0 }}>
                {listening ? `Recording… ${duration}s` : processing ? 'Analysing…' : 'Tap to record'}
              </p>
              {listening && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                  Tap again to stop
                </p>
              )}
            </div>

            <Waveform key={waveKey} active={listening} />
          </div>

          {/* Live transcript */}
          {transcript && (
            <div style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Transcript
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                {transcript}
              </p>
            </div>
          )}

          {/* Manual text input fallback */}
          {!listening && !transcript && !result && (
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>Or type your entry:</p>
              <textarea
                placeholder="What's on your mind today?"
                onChange={e => setTranscript(e.target.value)}
                style={{
                  width: '100%', minHeight: 100, padding: '12px 14px',
                  borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f4f4f5', outline: 'none', resize: 'vertical',
                }}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', borderRadius: 10 }}>
              {error}
            </p>
          )}

          {/* Analyse button */}
          {transcript && !listening && !result && (
            <button
              onClick={() => analyseEntry(transcript)}
              disabled={processing}
              style={{
                width: '100%', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 800,
                border: 'none', cursor: processing ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
              }}
            >
              {processing ? 'Analysing…' : '✨ Analyse my entry'}
            </button>
          )}

          {/* AI result */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Mood + summary */}
              <div style={{
                padding: '16px', borderRadius: 16,
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
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p style={{ fontSize: 12, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  ✨ {result.affirmation}
                </p>
              </div>

              {/* Save / discard */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={saveEntry}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: '#fff',
                  }}
                >
                  Save to journal
                </button>
                <button
                  onClick={() => { setResult(null); setTranscript('') }}
                  style={{
                    padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📓</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>No entries yet</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Record your first voice note to get started</p>
              <button
                onClick={() => setView('record')}
                style={{
                  marginTop: 20, padding: '10px 24px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  background: 'rgba(139,92,246,0.15)', color: '#c4b5fd',
                  border2: '1px solid rgba(139,92,246,0.3)',
                } as React.CSSProperties}
              >
                Record now →
              </button>
            </div>
          ) : (
            <>
              {/* Mood summary strip */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 14px',
                borderRadius: 14, background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)', marginBottom: 4,
              }}>
                {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
                  <span key={mood} style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
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
        </div>
      )}
    </div>
  )
}
