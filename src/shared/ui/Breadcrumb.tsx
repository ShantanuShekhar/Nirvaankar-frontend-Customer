import { cn } from '@/shared/utils/helpers'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

export type BreadcrumbItem = {
  label: string
  to?: string
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm text-[var(--color-fg-muted)]', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 ? <ChevronRight size={14} className="opacity-50" aria-hidden /> : null}
              {item.to && !last ? (
                <Link to={item.to} className="hover:text-[var(--color-brand)]">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? 'font-medium text-[var(--color-fg)]' : undefined}
                  aria-current={last ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
