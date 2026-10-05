# voicejournal

ai-voice-home

**Live:** https://ai-voice-home.vercel.app

## Tech stack
Next.js, React, TypeScript, Tailwind CSS

## Run locally
```bash
git clone https://github.com/infosiva/voicejournal.git && cd voicejournal
npm install
cp .env.example .env.local   # names only, fill in your own values
npm run dev                    # http://localhost:3000
```

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Environment variables
Names only; never commit real values. Everything is optional unless the feature needs it.

**AI providers (free-first chain; any one is enough):** `GEMINI_API_KEY`, `GROQ_API_KEY`, `OLLAMA_HOST`

- `ANTHROPIC_API_KEY`
- `GNEWS_API_KEY`
- `HA_TOKEN`
- `HA_URL`
- `PROMO_CODES`

## Deploy
Vercel (`vercel --prod`). Set the variables above in the project settings.

## Status & open items
See `HANDOFF.md` if present; otherwise open an issue.
