/**
 * POST /api/voice/journal
 * Accepts: { transcript: string, mood?: string }
 * Returns: { summary, insights, mood, tags, wordCount }
 *
 * AI analyses a voice note transcript and returns:
 *   - 2-sentence summary
 *   - 3 actionable insights or reflections
 *   - detected mood label
 *   - topic tags
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Simple free-first AI fallback (Groq → Gemini → Anthropic)
async function analyseJournal(transcript: string): Promise<string> {
  const prompt = `You are an empathetic personal journal AI. Analyse this voice journal entry and return insights.

JOURNAL ENTRY:
"""
${transcript}
"""

Return ONLY a valid JSON object:
{
  "summary": "2-sentence summary of what was said",
  "mood": "one word: Happy | Reflective | Anxious | Grateful | Frustrated | Excited | Sad | Neutral | Motivated | Tired",
  "moodEmoji": "matching emoji",
  "insights": [
    "First observation or reflection",
    "Second observation or reflection",
    "Third observation or reflection"
  ],
  "tags": ["topic1", "topic2", "topic3"],
  "affirmation": "One encouraging sentence for the journaller"
}

Be warm, non-judgmental, and concise. Output ONLY the JSON.`

  const providers = [
    // Groq
    async () => {
      const key = process.env.GROQ_API_KEY
      if (!key) throw new Error('no key')
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 512,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`Groq ${res.status}`)
      const d = await res.json()
      return d.choices[0].message.content as string
    },
    // Gemini
    async () => {
      const key = process.env.GEMINI_API_KEY
      if (!key) throw new Error('no key')
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!res.ok) throw new Error(`Gemini ${res.status}`)
      const d = await res.json()
      return d.candidates?.[0]?.content?.parts?.[0]?.text as string
    },
    // Anthropic
    async () => {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) throw new Error('no key')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) throw new Error(`Anthropic ${res.status}`)
      const d = await res.json()
      return d.content?.[0]?.text as string
    },
  ]

  for (const provider of providers) {
    try {
      const result = await provider()
      if (result) return result
    } catch { /* try next */ }
  }
  throw new Error('All AI providers failed')
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Transcript too short' }, { status: 400 })
    }

    const raw = await analyseJournal(transcript.slice(0, 4000))
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: {
      summary: string
      mood: string
      moodEmoji: string
      insights: string[]
      tags: string[]
      affirmation: string
    }

    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI parse error — try again' }, { status: 500 })
    }

    return NextResponse.json({
      summary:     parsed.summary     ?? '',
      mood:        parsed.mood        ?? 'Neutral',
      moodEmoji:   parsed.moodEmoji   ?? '😐',
      insights:    parsed.insights    ?? [],
      tags:        parsed.tags        ?? [],
      affirmation: parsed.affirmation ?? '',
      wordCount:   transcript.trim().split(/\s+/).length,
    })
  } catch (err) {
    console.error('journal error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
