import { cn } from '@/shared/utils/helpers'
import type { TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
  hint?: string
}

export function TextArea({ label, error, hint, className, id, ...props }: Props) {
  const inputId = id ?? props.name
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      <span className="font-medium text-[var(--color-fg)]">{label}</span>
      <textarea
        id={inputId}
        className={cn(
          'min-h-28 rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]',
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
