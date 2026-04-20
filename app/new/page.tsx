'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Tag } from '@/lib/types'
import TagPill from '@/components/TagPill'

const TAG_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
]

export default function NewArticlePage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [summary, setSummary] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient().from('tags').select('*').order('name').then(({ data }) => {
      setAllTags(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!tagInput.trim()) { setSuggestions([]); return }
    const lower = tagInput.toLowerCase()
    setSuggestions(
      allTags.filter(
        (t) => t.name.toLowerCase().includes(lower) && !selectedTags.find((s) => s.id === t.id)
      )
    )
  }, [tagInput, allTags, selectedTags])

  const addTag = (tag: Tag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags((prev) => [...prev, tag])
    }
    setTagInput('')
    setShowSuggestions(false)
  }

  const createAndAddTag = async () => {
    const name = tagInput.trim()
    if (!name) return
    const color = TAG_COLORS[colorIndex % TAG_COLORS.length]
    setColorIndex((c) => c + 1)
    const supabase = createClient()

    const { data: existing } = await supabase.from('tags').select('*').eq('name', name).single()
    if (existing) { addTag(existing); return }

    const { data, error } = await supabase.from('tags').insert({ name, color }).select().single()
    if (!error && data) {
      setAllTags((prev) => [...prev, data])
      addTag(data)
    }
  }

  const removeTag = (id: string) => setSelectedTags((prev) => prev.filter((t) => t.id !== id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({
        title: title.trim(),
        body: body.trim(),
        summary: summary.trim() || null,
      })
      .select()
      .single()

    if (articleError || !article) {
      setError(articleError?.message ?? 'Failed to save article')
      setSubmitting(false)
      return
    }

    if (selectedTags.length > 0) {
      await supabase.from('article_tags').insert(
        selectedTags.map((t) => ({ article_id: article.id, tag_id: t.id }))
      )
    }

    router.push(`/dashboard?article=${article.id}`)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px', width: '100%' }}>
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '32px',
        }}
      >
        New article
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="field"
            style={{ fontSize: '18px', fontWeight: 500 }}
            required
          />
        </div>

        {/* Body */}
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste article text or research notes…"
            className="field"
            rows={18}
            required
            style={{ resize: 'vertical', lineHeight: 1.8 }}
          />
        </div>

        {/* Summary */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '8px',
            }}
          >
            Summary <span style={{ opacity: 0.5 }}>(optional)</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Your own summary or key takeaways…"
            className="field"
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Tags */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '8px',
            }}
          >
            Tags
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
            {selectedTags.map((t) => (
              <TagPill key={t.id} tag={t} onRemove={() => removeTag(t.id)} />
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (suggestions.length > 0) addTag(suggestions[0])
                  else createAndAddTag()
                }
              }}
              placeholder="Search or create tag…"
              className="field"
              style={{ maxWidth: '280px' }}
            />

            {showSuggestions && (suggestions.length > 0 || tagInput.trim()) && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  minWidth: '200px',
                  zIndex: 50,
                  marginTop: '4px',
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => addTag(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      color: 'var(--text)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    {s.name}
                  </button>
                ))}
                {tagInput.trim() && !suggestions.find((s) => s.name === tagInput.trim()) && (
                  <button
                    type="button"
                    onMouseDown={createAndAddTag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderTop: suggestions.length ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: 'var(--accent)' }}>+</span>
                    Create &ldquo;{tagInput.trim()}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ color: '#e87070', fontSize: '12px', borderLeft: '2px solid #e87070', paddingLeft: '8px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '4px' }}>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Saving…' : 'Save article'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
