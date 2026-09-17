import { toast, useToastStore, type ToastTone } from '@/store/toastStore'
import { cn } from '@/shared/utils/helpers'
import { X } from 'lucide-react'

const toneClass: Record<ToastTone, string> = {
  neutral: 'border-[var(--color-border)]',
  success: 'border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))]',
  warn: 'border-[color-mix(in_srgb,var(--color-warn)_40%,var(--color-border))]',
  danger: 'border-[color-mix(in_srgb,var(--color-danger)_40%,var(--color-border))]',
}

export function ToastHost() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)

  if (!items.length) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-lg)] border bg-[var(--color-bg-elevated)] px-4 py-3 shadow-[var(--shadow-lift)]',
            toneClass[item.tone ?? 'neutral'],
          )}
          role="status"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-fg)]">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">{item.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            className="rounded-full p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            onClick={() => dismiss(item.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export { toast }
