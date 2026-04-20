import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Article, Comment, Tag } from '@/lib/types'
import TagPill from '@/components/TagPill'
import CommentThread from '@/components/CommentThread'

export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: articleRaw } = await supabase
    .from('articles')
    .select(`
      *,
      article_tags(tag_id, tags(*))
    `)
    .eq('id', id)
    .single()

  if (!articleRaw) notFound()

  const article: Article = {
    id: articleRaw.id,
    user_id: articleRaw.user_id,
    title: articleRaw.title,
    body: articleRaw.body,
    summary: articleRaw.summary,
    created_at: articleRaw.created_at,
    tags: (articleRaw.article_tags ?? []).map((at: { tags: Tag }) => at.tags).filter(Boolean),
  }

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', id)
    .order('created_at', { ascending: true })

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px', width: '100%' }}>
      {/* Back link */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/map"
          style={{ color: 'var(--text-dim)', fontSize: '11px', textDecoration: 'none', letterSpacing: '0.04em' }}
        >
          ← Back to map
        </Link>
      </div>

      <article>
        {/* Header */}
        <header style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1.4,
              letterSpacing: '0.02em',
              margin: '0 0 12px',
            }}
          >
            {article.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{fmt(article.created_at)}</span>
            {(article.tags ?? []).map((t) => (
              <TagPill key={t.id} tag={t} />
            ))}
          </div>
        </header>

        {/* Summary */}
        {article.summary && (
          <div
            style={{
              borderLeft: '2px solid var(--accent)',
              paddingLeft: '16px',
              marginBottom: '28px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontStyle: 'italic',
              lineHeight: 1.75,
            }}
          >
            {article.summary}
          </div>
        )}

        {/* Body */}
        <div
          style={{
            color: 'var(--text)',
            fontSize: '13px',
            lineHeight: 1.9,
            whiteSpace: 'pre-wrap',
            marginBottom: '48px',
          }}
        >
          {article.body}
        </div>

        {/* Comments */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
          <CommentThread
            articleId={article.id}
            initialComments={(comments ?? []) as Comment[]}
          />
        </div>
      </article>
    </div>
  )
}
