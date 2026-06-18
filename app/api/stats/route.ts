import { NextRequest, NextResponse } from 'next/server'

let counts = { entriesRecorded: 0, minutesTranscribed: 0, insightsGenerated: 0 }

export async function GET() {
  return NextResponse.json(counts)
}

export async function POST(req: NextRequest) {
  const { event } = await req.json()
  if (event === 'entry_recorded') counts.entriesRecorded++
  if (event === 'minutes_transcribed') counts.minutesTranscribed++
  if (event === 'insight_generated') counts.insightsGenerated++
  return NextResponse.json({ ok: true })
}
