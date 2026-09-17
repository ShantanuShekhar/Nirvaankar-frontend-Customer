type Props = {
  compact?: boolean
  inverted?: boolean
  className?: string
}

export function BrandMark({ compact = false, inverted = false, className }: Props) {
  const ink = inverted ? 'var(--color-cream-50)' : 'var(--color-brand)'
  const accent = inverted ? 'var(--color-cream-200)' : 'var(--color-clay-600)'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <svg
        width={compact ? 28 : 34}
        height={compact ? 28 : 34}
        viewBox="0 0 64 64"
        aria-hidden
        className="shrink-0"
      >
        <rect width="64" height="64" rx="16" fill={ink} />
        <path
          d="M32 11c-1.8 7.6-7.4 13.4-15.2 17.2 9.4 1.8 15.2 7.6 17.2 17.2 2-9.6 7.8-15.4 17.2-17.2C39.4 24.4 33.8 18.6 32 11Z"
          fill={accent}
        />
        <circle cx="32" cy="49" r="3.2" fill={inverted ? '#faf7f2' : '#f3eee4'} />
      </svg>
      {!compact ? (
        <span className="min-w-0 leading-none">
          <span className="font-display block text-[1.65rem] tracking-tight" style={{ color: ink }}>
            Nirvaankar
          </span>
          <span
            className="mt-1 hidden text-[10px] uppercase tracking-[0.2em] sm:block"
            style={{ color: inverted ? 'rgba(250,247,242,0.72)' : 'var(--color-fg-muted)' }}
          >
            Thoughtfully made
          </span>
        </span>
      ) : null}
    </span>
  )
}
