// VoiceJournal logo: glyph + wordmark, key word in the hub-switchable accent.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, letterSpacing: '-0.02em' }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="color-mix(in oklab, var(--accent, #8b5cf6) 18%, #f5f0ff)" />
        <g fill="none" stroke="var(--accent, #8b5cf6)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="13" y="6" width="6" height="12" rx="3"/><path d="M8 15a8 8 0 0016 0M16 23v3"/></g>
      </svg>
      <span>Voice</span><span style={{ color: 'var(--accent, #8b5cf6)' }}>Journal</span>
    </span>
  )
}
