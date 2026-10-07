# DESIGN.md - VoiceJournal

Source of truth: `agents/design-system` (MASTER.md, `ds-source` skill). Reuse from there before building; new reusable pieces go there first.

## Identity
- Product: VoiceJournal (AI voice journal)
- Accent: `#8b5cf6` (unique in the portfolio per `design-system/scripts/check-palettes.mjs`; kept from the existing design)
- Base background: `#f5f0ff`
- Logo: `components/Logo.tsx` (glyph + wordmark, key word in `var(--accent)`), used in the header; favicon is `app/icon.svg` (no `icon.tsx`).
- Background: `components/AnimatedBg.tsx` mounted in `app/layout.tsx`; style comes from the hub (`layout.bgAnimation`, `bgSpeed`), default `mesh`.

## Hub override
Hub (Edge Config `theme_voicejournal.design`) customises dials, brief, palette, GA4 and flags with no code change; hub values win over this file. Theme is loaded via `lib/theme-loader.ts` in `app/layout.tsx`.

## AI platform (ai-core)
No ai-core yet. Exemption: AI is transcription/summary of the user's own entries via lib/ai.ts free-tier chain; no shared document store or RAG. Adopt ai-core if journal search/memory is added.
