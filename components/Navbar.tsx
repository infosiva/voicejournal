'use client'

export default function Navbar() {
  return (
    <nav className="navbar" style={{ padding: '0 16px' }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎙</span>
          <span style={{
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#0f172a',
          }}>
            Voice<span style={{ color: '#0d9488' }}>Journal</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 99,
            background: 'rgba(13,148,136,0.1)',
            border: '1px solid rgba(13,148,136,0.25)',
            color: '#0d9488',
            letterSpacing: '0.04em',
          }}>
            FREE
          </span>
          <button
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '7px 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              transition: 'opacity 160ms, transform 100ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Try now
          </button>
        </div>
      </div>
    </nav>
  )
}
