'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  const isLogin = pathname === '/login'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLogin) return null

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        padding: '0 20px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Link
          href="/dashboard"
          style={{
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          Cartograph
        </Link>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <Link
            href="/dashboard"
            className={`nav-link${pathname.startsWith('/dashboard') ? ' active' : ''}`}
          >
            Archive
          </Link>
          <Link
            href="/new"
            className={`nav-link${pathname === '/new' ? ' active' : ''}`}
          >
            New
          </Link>
          <Link
            href="/map"
            className={`nav-link${pathname === '/map' ? ' active' : ''}`}
          >
            Map
          </Link>
        </nav>
      </div>
      <button onClick={handleSignOut} className="btn btn-ghost" style={{ fontSize: '11px' }}>
        Sign out
      </button>
    </header>
  )
}
