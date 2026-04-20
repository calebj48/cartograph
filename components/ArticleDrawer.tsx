'use client'

import Link from 'next/link'
import { Article } from '@/lib/types'
import TagPill from './TagPill'

interface ArticleDrawerProps {
  article: Article | null
  onClose: () => void
}

export default function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  if (!article) return null

  const preview = article.summary || article.body.slice(0, 280) + (article.body.length > 280 ? '…' : '')

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          overflowY: 'auto',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}
          >
            Article
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '18px',
              lineHeight: 1,
              padding: '0 0 0 8px',
            }}
          >
            ×
          </button>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {article.title}
        </h2>

        {(article.tags ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(article.tags ?? []).map((t) => (
              <TagPill key={t.id} tag={t} />
            ))}
          </div>
        )}

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            lineHeight: 1.75,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {preview}
        </p>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <Link
            href={`/article/${article.id}`}
            style={{
              color: 'var(--accent)',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            Open full article →
          </Link>
        </div>
      </div>
    </>
  )
}
