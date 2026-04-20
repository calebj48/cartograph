'use client'

import { useState } from 'react'
import { Article, Comment, Tag } from '@/lib/types'
import TagPill from './TagPill'
import TagEditor from './TagEditor'
import CommentThread from './CommentThread'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

interface DashboardProps {
  articles: Article[]
  allTags: Tag[]
  commentsByArticle: Record<string, Comment[]>
  initialArticleId?: string
}

export default function Dashboard({ articles: initialArticles, allTags, commentsByArticle, initialArticleId }: DashboardProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialArticleId || (initialArticles[0]?.id ?? null)
  )
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState({ title: '', body: '', summary: '' })
  const [saving, setSaving] = useState(false)

  const selected = articles.find((a) => a.id === selectedId) ?? null

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const startEdit = () => {
    if (!selected) return
    setEditDraft({ title: selected.title, body: selected.body, summary: selected.summary ?? '' })
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('articles')
      .update({
        title: editDraft.title.trim(),
        body: editDraft.body.trim(),
        summary: editDraft.summary.trim() || null,
      })
      .eq('id', selected.id)
    if (!error) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === selected.id
            ? { ...a, title: editDraft.title.trim(), body: editDraft.body.trim(), summary: editDraft.summary.trim() || null }
            : a
        )
      )
      setEditing(false)
    }
    setSaving(false)
  }

  const deleteArticle = async () => {
    if (!selected) return
    if (!confirm(`Delete "${selected.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('articles').delete().eq('id', selected.id)
    const remaining = articles.filter((a) => a.id !== selected.id)
    setArticles(remaining)
    setSelectedId(remaining[0]?.id ?? null)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--border)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Archive</span>
          <span style={{ color: 'var(--text-dim)' }}>{articles.length}</span>
        </div>

        {articles.length === 0 && (
          <div style={{ padding: '20px 12px', color: 'var(--text-dim)', fontSize: '12px' }}>
            No articles yet.{' '}
            <Link href="/new" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Add one →
            </Link>
          </div>
        )}

        {articles.map((a) => (
          <div
            key={a.id}
            className={`article-item${selectedId === a.id ? ' selected' : ''}`}
            onClick={() => setSelectedId(a.id)}
          >
            <div
              style={{
                fontWeight: 500,
                fontSize: '12px',
                color: 'var(--text)',
                marginBottom: '4px',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {a.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
              {(a.tags ?? []).slice(0, 3).map((t) => (
                <TagPill key={t.id} tag={t} />
              ))}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{fmt(a.created_at)}</div>
          </div>
        ))}
      </aside>

      {/* Main area */}
      <section style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        {!selected ? (
          <div style={{ color: 'var(--text-dim)', marginTop: '60px', textAlign: 'center' }}>
            Select an article or{' '}
            <Link href="/new" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              add a new one
            </Link>
          </div>
        ) : (
          <article>
            {editing ? (
              /* ── Edit mode ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
                <input
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                  className="field"
                  style={{ fontSize: '18px', fontWeight: 500 }}
                  placeholder="Title"
                />
                <div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Summary <span style={{ opacity: 0.5 }}>(optional)</span>
                  </div>
                  <textarea
                    value={editDraft.summary}
                    onChange={(e) => setEditDraft((d) => ({ ...d, summary: e.target.value }))}
                    className="field"
                    rows={3}
                    style={{ resize: 'vertical' }}
                    placeholder="Key takeaways…"
                  />
                </div>
                <textarea
                  value={editDraft.body}
                  onChange={(e) => setEditDraft((d) => ({ ...d, body: e.target.value }))}
                  className="field"
                  rows={18}
                  style={{ resize: 'vertical', lineHeight: 1.8 }}
                  placeholder="Article text…"
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveEdit} disabled={saving || !editDraft.title.trim() || !editDraft.body.trim()} className="btn btn-primary">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} className="btn">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em', lineHeight: 1.4, margin: 0 }}>
                      {selected.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, marginTop: '4px' }}>
                      <button onClick={startEdit} className="btn btn-ghost" style={{ fontSize: '11px' }}>Edit</button>
                      <button onClick={deleteArticle} className="btn btn-ghost" style={{ fontSize: '11px', color: '#e87070' }}>Delete</button>
                      <Link href={`/article/${selected.id}`} style={{ color: 'var(--text-dim)', fontSize: '11px', textDecoration: 'none' }}>
                        full view →
                      </Link>
                    </div>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '16px' }}>
                    {fmt(selected.created_at)}
                  </div>

                  <TagEditor
                    key={selected.id}
                    articleId={selected.id}
                    initialTags={selected.tags ?? []}
                    allTags={allTags}
                    onTagsChange={(tags) =>
                      setArticles((prev) =>
                        prev.map((a) => (a.id === selected.id ? { ...a, tags } : a))
                      )
                    }
                  />
                </div>

                {selected.summary && (
                  <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '14px', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.7 }}>
                    {selected.summary}
                  </div>
                )}

                <div style={{ color: 'var(--text)', fontSize: '13px', lineHeight: 1.85, whiteSpace: 'pre-wrap', marginBottom: '40px', maxWidth: '720px' }}>
                  {selected.body}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', marginBottom: '28px' }} />

                <CommentThread key={selected.id} articleId={selected.id} initialComments={commentsByArticle[selected.id] ?? []} />
              </>
            )}
          </article>
        )}
      </section>
    </div>
  )
}
