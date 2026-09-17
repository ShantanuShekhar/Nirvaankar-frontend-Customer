import { cn } from '@/shared/utils/helpers'
import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'article' | 'section'
  padded?: boolean
  hover?: boolean
  children: ReactNode
}

export function Card({
  as: Comp = 'div',
  padded = true,
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Comp
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-soft)]',
        padded && 'p-5 sm:p-6',
        hover && 'transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}
