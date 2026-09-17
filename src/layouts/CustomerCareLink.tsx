import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from '@/config/defaults'
import { Headset } from 'lucide-react'

type Props = {
  className?: string
  showLabel?: boolean
}

export function CustomerCareLink({ className, showLabel = false }: Props) {
  return (
    <a
      href={SUPPORT_PHONE_HREF}
      className={`inline-flex items-center gap-1.5 rounded p-2 text-[var(--color-brand)] transition hover:bg-[var(--color-bg-muted)] ${className ?? ''}`}
      aria-label={`Customer care ${SUPPORT_PHONE}`}
      title={`Customer care: ${SUPPORT_PHONE} · ${SUPPORT_EMAIL}`}
    >
      <Headset size={20} aria-hidden />
      {showLabel ? (
        <span className="text-sm">Customer Care</span>
      ) : (
        <span className="hidden text-sm lg:inline">{SUPPORT_PHONE}</span>
      )}
    </a>
  )
}
