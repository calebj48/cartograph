'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account, then sign in.')
        setMode('signin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '320px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '48px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '6px',
            }}
          >
            Knowledge Mapping
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--accent)',
            }}
          >
            Cartograph
          </div>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setMode('signin')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: mode === 'signin' ? 'var(--accent)' : 'var(--text-dim)',
              padding: 0,
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: mode === 'signup' ? 'var(--accent)' : 'var(--text-dim)',
              padding: 0,
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: '11px',
                color: '#e87070',
                borderLeft: '2px solid #e87070',
                paddingLeft: '8px',
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--accent)',
                borderLeft: '2px solid var(--accent)',
                paddingLeft: '8px',
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: '8px' }}
          >
            {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
