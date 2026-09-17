import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/helpers'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-10 text-center',
        className,
      )}
      role="alert"
    >
      <h2 className="font-display text-2xl text-[var(--color-brand)]">{title}</h2>
      <p className="mt-2 text-[var(--color-fg-muted)]">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
