import { cn } from '@/shared/utils/helpers'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-fg)] shadow-sm hover:bg-[var(--color-action-hover)] hover:shadow-[var(--shadow-soft)] active:scale-[0.98]',
  secondary:
    'bg-[var(--color-button-secondary-bg)] text-[var(--color-button-secondary-fg)] border border-[var(--color-button-secondary-border)] hover:bg-[var(--color-action-soft)] active:scale-[0.98]',
  soft: 'bg-[var(--color-action-soft)] text-[var(--color-forest-800)] hover:bg-[color-mix(in_srgb,var(--color-action)_18%,white)]',
  ghost: 'bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-bg-muted)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm tracking-wide',
  lg: 'h-12 px-7 text-base tracking-wide',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
}
