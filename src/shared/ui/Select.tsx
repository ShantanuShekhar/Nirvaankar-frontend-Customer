import { cn } from '@/shared/utils/helpers'
import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, error, hint, className, id, options, ...props }: Props) {
  const inputId = id ?? props.name
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      <span className="font-medium text-[var(--color-fg)]">{label}</span>
      <select
        id={inputId}
        className={cn(
          'h-11 rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] px-3 text-[var(--color-fg)]',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error ? (
        <span id={`${inputId}-hint`} className="text-xs text-[var(--color-fg-muted)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}
