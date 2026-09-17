import { cn } from '@/shared/utils/helpers'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/ui/Button'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  side?: 'bottom' | 'right'
  className?: string
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'bottom',
  className,
}: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const panel =
    side === 'right'
      ? 'ml-auto h-full w-full max-w-md rounded-none sm:rounded-l-[var(--radius-xl)]'
      : 'mt-auto max-h-[88vh] w-full rounded-t-[var(--radius-xl)] animate-[nv-slide-up_var(--motion-base)_var(--ease-out)]'

  return createPortal(
    <div className="fixed inset-0 z-[80] flex" role="presentation">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-forest-950)_48%,transparent)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-overlay)]',
          panel,
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          {title ? <h2 className="font-display text-2xl text-[var(--color-brand)]">{title}</h2> : <span />}
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--color-border)] px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
