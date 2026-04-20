'use client'

import { useState } from 'react'
import { Comment } from '@/lib/types'
import { createClient } from '@/lib/supabase-browser'

interface CommentThreadProps {
  articleId: string
  initialComments: Comment[]
}

export default function CommentThread({ articleId, initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('comments')
      .insert({ article_id: articleId, body: body.trim() })
      .select()
      .single()

    if (!error && data) {
      setComments((prev) => [...prev, data])
      setBody('')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', id)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '16px',
        }}
      >
        Notes ({comments.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {comments.length === 0 && (
          <div style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic' }}>
            No notes yet.
          </div>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              borderLeft: '2px solid var(--border)',
              paddingLeft: '12px',
              paddingTop: '4px',
              paddingBottom: '4px',
            }}
          >
            <div style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
              {c.body}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '10px',
                color: 'var(--text-dim)',
              }}
            >
              <span>{fmt(c.created_at)}</span>
              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '10px',
                  padding: 0,
                }}
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note…"
          rows={2}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: '13px',
            padding: '6px 0',
            resize: 'none',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
          }}
        />
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="btn"
          style={{ flexShrink: 0, marginBottom: '1px' }}
        >
          {submitting ? '...' : 'Add'}
        </button>
      </form>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
        ⌘ + Enter to submit
      </div>
    </div>
  )
}
