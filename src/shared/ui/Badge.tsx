import { cn } from '@/shared/utils/helpers'
import type { ReactNode } from 'react'

type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'warn' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)]',
  brand: 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]',
  accent: 'bg-[color-mix(in_srgb,var(--color-accent)_14%,white)] text-[var(--color-accent)]',
  success: 'bg-[color-mix(in_srgb,var(--color-success)_14%,white)] text-[var(--color-success)]',
  warn: 'bg-[color-mix(in_srgb,var(--color-warn)_14%,white)] text-[var(--color-warn)]',
  danger: 'bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]',
}

export function Badge({
  children,
  className,
  tone = 'brand',
}: {
  children: ReactNode
  className?: string
  tone?: Tone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
