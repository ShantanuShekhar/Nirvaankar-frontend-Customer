import { Star } from 'lucide-react'

type Props = {
  rating: number
  max?: number
  size?: number
  showValue?: boolean
  className?: string
}

export function StarRating({ rating, max = 5, size = 16, showValue = false, className }: Props) {
  const clamped = Math.max(0, Math.min(max, rating))
  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ''}`} aria-label={`${clamped.toFixed(1)} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = clamped >= i + 1
        const half = !filled && clamped > i && clamped < i + 1
        return (
          <Star
            key={i}
            size={size}
            className={
              filled || half
                ? 'fill-[var(--color-clay-500)] text-[var(--color-clay-500)]'
                : 'text-[var(--color-border)]'
            }
            fill={filled || half ? 'currentColor' : 'none'}
          />
        )
      })}
      {showValue ? <span className="ml-1 text-sm font-medium text-[var(--color-fg)]">{clamped.toFixed(1)}</span> : null}
    </div>
  )
}
