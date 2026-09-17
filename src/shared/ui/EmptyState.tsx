import { cn } from '@/shared/utils/helpers'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  className?: string
  icon?: ReactNode
}

export function EmptyState({ title, description, action, className, icon }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center',
        className,
      )}
    >
      {icon ? <div className="text-[var(--color-brand)]">{icon}</div> : null}
      <h2 className="font-display text-3xl text-[var(--color-brand)]">{title}</h2>
      <p className="max-w-md text-[var(--color-fg-muted)]">{description}</p>
      {action}
    </div>
  )
}
