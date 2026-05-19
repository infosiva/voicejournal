import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

let _g: Groq | null = null
function g() { if (!_g) _g = new Groq({ apiKey: process.env.GROQ_API_KEY! }); return _g }

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json()
    const res = await g().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system ?? 'You are VoiceHome AI — a voice and smart home assistant. Help users with voice AI features, home automation tips, and getting the most from AI-powered home tech. Be friendly and concise.' }, ...messages],
      max_tokens: 400,
    })
    return NextResponse.json({ text: res.choices[0]?.message?.content ?? 'Happy to help!' })
  } catch {
    return NextResponse.json({ text: 'Try again in a moment!' }, { status: 200 })
  }
}
