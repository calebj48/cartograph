import { Tag } from '@/lib/types'

interface TagPillProps {
  tag: Tag
  onRemove?: () => void
}

export default function TagPill({ tag, onRemove }: TagPillProps) {
  const hex = tag.color || '#6366f1'

  // Darken the hex for background (add alpha)
  const bgColor = hex + '22'
  const borderColor = hex + '55'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        fontSize: '10px',
        letterSpacing: '0.06em',
        fontFamily: 'inherit',
        borderRadius: '2px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        color: hex,
        whiteSpace: 'nowrap',
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: hex,
            cursor: 'pointer',
            padding: '0',
            lineHeight: 1,
            opacity: 0.7,
            fontFamily: 'inherit',
            fontSize: '11px',
          }}
          title="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  )
}
