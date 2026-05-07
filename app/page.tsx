'use client'

import { useState, useRef, useEffect } from 'react'

// Browser Speech API types (not in all TS lib versions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

interface CommandEntry {
  transcript: string
  response: string
  action: string
  device: string
  mock: boolean
  timestamp: Date
}

const AFFILIATE_PRODUCTS = [
  { name: 'Philips Hue Starter Kit', price: '$79', url: 'https://amazon.com/dp/B07FZJN2HZ', tag: 'Smart Lights' },
  { name: 'Nest Learning Thermostat', price: '$249', url: 'https://amazon.com/dp/B07HNHGS16', tag: 'Thermostat' },
  { name: 'August Smart Lock Pro',   price: '$199', url: 'https://amazon.com/dp/B0752FPMG1', tag: 'Smart Lock' },
  { name: 'Echo Dot (5th Gen)',       price: '$49',  url: 'https://amazon.com/dp/B09ZX5K27T', tag: 'Voice Hub' },
]

export default function Home() {
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [history, setHistory]       = useState<CommandEntry[]>([])
  const [processing, setProcessing] = useState(false)
  const [haConfigured, setHaConfigured] = useState(false)
  const [status, setStatus]         = useState('')

  const recognitionRef = useRef<AnySpeechRecognition>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setHaConfigured(false) // Default mock mode
  }, [])

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setStatus('Speech recognition not supported in this browser. Use Chrome.')
      return
    }

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>)
        .map(r => r[0].transcript).join('')
      setTranscript(t)
    }

    rec.onend = () => {
      setListening(false)
      if (transcript.trim()) processCommand(transcript)
    }

    rec.onerror = () => setListening(false)

    recognitionRef.current = rec
    rec.start()
    setListening(true)
    setTranscript('')
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  async function processCommand(text: string) {
    setProcessing(true)
    setStatus('Understanding command...')
    try {
      // 1. Interpret command
      const interpretRes = await fetch('/api/voice/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const command = await interpretRes.json()

      // 2. Execute on Home Assistant (or mock)
      setStatus('Executing...')
      const controlRes = await fetch('/api/home/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      })
      const result = await controlRes.json()

      // 3. Speak response
      setStatus('Speaking...')
      const speakRes = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: command.response }),
      })

      if (speakRes.ok) {
        const blob = await speakRes.blob()
        const url  = URL.createObjectURL(blob)
        if (!audioRef.current) audioRef.current = new Audio()
        audioRef.current.src = url
        audioRef.current.play()
      }

      setHistory(prev => [{
        transcript: text,
        response:   command.response,
        action:     command.action,
        device:     command.friendlyName,
        mock:       result.mock ?? true,
        timestamp:  new Date(),
      }, ...prev.slice(0, 9)])

      setStatus('')
    } catch {
      setStatus('Error processing command')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-green-400">AI Voice Home</h1>
        <p className="text-xs text-gray-500">Control your smart home with voice commands</p>
        {!haConfigured && (
          <p className="text-xs text-yellow-500 mt-1">Demo mode — set HA_URL + HA_TOKEN env vars to connect real devices</p>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        {/* Left: Voice + History */}
        <div className="md:col-span-2 space-y-6">
          {/* Voice Button */}
          <div className="flex flex-col items-center gap-4 py-8">
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              disabled={processing}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all text-4xl shadow-lg ${
                listening
                  ? 'bg-red-600 shadow-red-500/30 scale-110 animate-pulse'
                  : processing
                    ? 'bg-gray-700 cursor-wait'
                    : 'bg-green-600 hover:bg-green-500 shadow-green-500/20 hover:scale-105'
              }`}
            >
              {listening ? '🎙' : processing ? '⏳' : '🎤'}
            </button>
            <p className="text-sm text-gray-400">
              {listening ? 'Listening...' : processing ? status : 'Hold to speak'}
            </p>
            {transcript && (
              <p className="text-sm text-white bg-gray-900 rounded-xl px-4 py-2 max-w-sm text-center">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
          </div>

          {/* Example Commands */}
          <div>
            <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">Try saying...</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Turn on living room lights',
                'Set thermostat to 72 degrees',
                'Lock the front door',
                'Turn off bedroom lights',
                'What\'s the temperature?',
              ].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => !processing && processCommand(cmd)}
                  className="text-xs border border-gray-800 hover:border-green-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Command History</h2>
              {history.map((h, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">&ldquo;{h.transcript}&rdquo;</p>
                    {h.mock && <span className="text-xs text-yellow-600 bg-yellow-900/20 px-2 py-0.5 rounded-full">Demo</span>}
                  </div>
                  <p className="text-xs text-gray-400">{h.response}</p>
                  <p className="text-xs text-gray-600">{h.device} · {h.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Affiliate Products */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recommended Devices</h2>
          {AFFILIATE_PRODUCTS.map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-900 border border-gray-800 hover:border-green-700 rounded-xl p-4 transition-colors group"
            >
              <span className="text-xs text-green-600 bg-green-900/20 px-2 py-0.5 rounded-full">{p.tag}</span>
              <p className="text-sm font-medium mt-2 group-hover:text-green-400 transition-colors">{p.name}</p>
              <p className="text-green-400 font-bold mt-1">{p.price}</p>
              <p className="text-xs text-gray-600 mt-1">View on Amazon →</p>
            </a>
          ))}
          <p className="text-xs text-gray-700">Affiliate links — we earn a small commission at no cost to you.</p>
        </div>
      </main>
    </div>
  )
}
