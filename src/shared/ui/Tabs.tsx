import { cn } from '@/shared/utils/helpers'
import type { ReactNode } from 'react'

export type TabItem = {
  id: string
  label: string
  count?: number
}

type Props = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
  trailing?: ReactNode
}

export function Tabs({ items, value, onChange, className, trailing }: Props) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div
        role="tablist"
        className="flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)] p-1 nv-hide-scrollbar"
      >
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition',
                active
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-brand)] shadow-sm'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
              )}
              onClick={() => onChange(item.id)}
            >
              {item.label}
              {item.count != null ? (
                <span className="rounded-full bg-[var(--color-brand-soft)] px-1.5 text-[11px] text-[var(--color-brand)]">
                  {item.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {trailing}
    </div>
  )
}
