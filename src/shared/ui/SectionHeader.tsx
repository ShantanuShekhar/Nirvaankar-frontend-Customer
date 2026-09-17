import { cn } from '@/shared/utils/helpers'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  eyebrow?: string
  title: string
  description?: string
  action?: { label: string; to: string } | ReactNode
  className?: string
  align?: 'start' | 'center'
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  align = 'start',
}: Props) {
  const isLink =
    action && typeof action === 'object' && action !== null && 'to' in action && 'label' in action

  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        align === 'center' && 'flex-col items-center text-center',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'max-w-2xl')}>
        {eyebrow ? <p className="nv-label">{eyebrow}</p> : null}
        <h2 className={cn('font-display text-3xl text-[var(--color-brand)] sm:text-4xl', eyebrow && 'mt-2')}>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl text-[var(--color-fg-muted)]">{description}</p>
        ) : null}
      </div>
      {isLink ? (
        <Link
          to={(action as { to: string }).to}
          className="text-sm font-medium text-[var(--color-brand)] underline-offset-4 hover:underline"
        >
          {(action as { label: string }).label}
        </Link>
      ) : (
        action
      )}
    </div>
  )
}
