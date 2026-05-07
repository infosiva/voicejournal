import { NextRequest, NextResponse } from 'next/server'
import { parseVoiceCommand } from '@/lib/voiceProcessor'

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()
    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Transcript required' }, { status: 400 })
    }
    const command = await parseVoiceCommand(transcript)
    return NextResponse.json(command)
  } catch (e: unknown) {
    console.error('[interpret]', e)
    return NextResponse.json({ error: 'Failed to interpret command' }, { status: 500 })
  }
}
