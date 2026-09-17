import { cn } from '@/shared/utils/helpers'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  requiredMark?: boolean
}

export function Input({ label, error, hint, className, id, requiredMark, ...props }: InputProps) {
  const inputId = id ?? props.name
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      <span className="font-medium text-[var(--color-fg)]">
        {label}
        {requiredMark || props.required ? (
          <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </span>
      <input
        id={inputId}
        className={cn(
          'h-11 rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] px-3 text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
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
