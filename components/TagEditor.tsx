'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag } from '@/lib/types'
import TagPill from './TagPill'
import { createClient } from '@/lib/supabase-browser'

const TAG_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
]

interface TagEditorProps {
  articleId: string
  initialTags: Tag[]
  allTags: Tag[]
  onTagsChange?: (tags: Tag[]) => void
}

export default function TagEditor({ articleId, initialTags, allTags, onTagsChange }: TagEditorProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }
    const lower = input.toLowerCase()
    const filtered = allTags.filter(
      (t) => t.name.toLowerCase().includes(lower) && !tags.find((at) => at.id === t.id)
    )
    setSuggestions(filtered)
  }, [input, allTags, tags])

  const addTag = async (tag: Tag) => {
    if (tags.find((t) => t.id === tag.id)) return
    const supabase = createClient()
    const { error } = await supabase
      .from('article_tags')
      .insert({ article_id: articleId, tag_id: tag.id })
    if (!error) {
      const next = [...tags, tag]
      setTags(next)
      onTagsChange?.(next)
    }
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const createAndAddTag = async () => {
    const name = input.trim()
    if (!name) return
    const color = TAG_COLORS[colorIndex % TAG_COLORS.length]
    setColorIndex((c) => c + 1)
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('tags')
      .select('*')
      .eq('name', name)
      .single()

    let tag: Tag
    if (existing) {
      tag = existing
    } else {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name, color })
        .select()
        .single()
      if (error || !data) return
      tag = data
    }

    await addTag(tag)
  }

  const removeTag = async (tag: Tag) => {
    const supabase = createClient()
    await supabase
      .from('article_tags')
      .delete()
      .eq('article_id', articleId)
      .eq('tag_id', tag.id)
    const next = tags.filter((t) => t.id !== tag.id)
    setTags(next)
    onTagsChange?.(next)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} onRemove={() => removeTag(tag)} />
        ))}
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (suggestions.length > 0) addTag(suggestions[0])
                else createAndAddTag()
              }
            }}
            placeholder="add tag…"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontFamily: 'inherit',
              fontSize: '11px',
              padding: '2px 4px',
              width: '90px',
              outline: 'none',
            }}
          />

          {showSuggestions && (suggestions.length > 0 || input.trim()) && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                minWidth: '160px',
                zIndex: 50,
                marginTop: '4px',
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={() => addTag(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    color: 'var(--text)',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  {s.name}
                </button>
              ))}
              {input.trim() && !suggestions.find((s) => s.name === input.trim()) && (
                <button
                  onMouseDown={createAndAddTag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 10px',
                    background: 'none',
                    border: 'none',
                    borderTop: suggestions.length ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: 'var(--accent)' }}>+</span>
                  Create &ldquo;{input.trim()}&rdquo;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
