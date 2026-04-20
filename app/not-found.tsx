import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
        404
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Page not found</div>
      <Link href="/dashboard" style={{ color: 'var(--accent)', fontSize: '12px', textDecoration: 'none' }}>
        ← Go to archive
      </Link>
    </div>
  )
}
