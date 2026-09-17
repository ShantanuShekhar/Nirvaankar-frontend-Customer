import type { OrderTrackingView, ShipmentTrackingView } from '@/api/endpoints/commerce'
import { cn } from '@/shared/utils/helpers'
import { useEffect, useMemo, useState } from 'react'

/** Customer-facing stages — must match seller OrderTimeline mapping. */
const FLOW = [
  { id: 'placed', label: 'Order Placed' },
  { id: 'packed', label: 'Packed' },
  { id: 'ready', label: 'Ready for Pickup' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
] as const

const STEP_MS = 220

function activeStepIndex(orderStatus: string, _paymentStatus: string, shipment?: ShipmentTrackingView | null): number {
  const os = orderStatus.toLowerCase()
  const ss = (shipment?.status ?? '').toLowerCase()

  if (ss === 'delivered' || os === 'delivered') return 6
  if (ss === 'out_for_delivery') return 5
  if (ss === 'in_transit') return 4
  if (ss === 'shipped' || ss === 'picked_up' || ss === 'picked' || os === 'shipped') return 3
  if (os === 'ready_for_pickup' || os === 'packed' || ss === 'created' || ss === 'label_generated' || ss === 'pickup_scheduled') {
    return 2
  }
  // Newly placed — Packed is the active next step
  return 1
}

function exceptionLabel(status: string): string | null {
  const s = status.toLowerCase()
  if (s.includes('cancel')) return 'Logistics partner cancelled the order'
  if (s.includes('return_requested')) return 'Return Requested'
  if (s.includes('return_approved')) return 'Return Approved'
  if (s.includes('return_picked')) return 'Return Picked Up'
  if (s.includes('refund')) return 'Refunded'
  if (s === 'rto' || s.includes('rto')) return 'RTO'
  return null
}

function TrackingStepper({
  active,
  exception,
}: {
  active: number
  exception: string | null
}) {
  const [revealed, setRevealed] = useState(0)
  const [lineReady, setLineReady] = useState(false)
  const target = exception ? -1 : active

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target < 0) {
      setRevealed(Math.max(0, target) + 1)
      setLineReady(true)
      return
    }
    setRevealed(0)
    setLineReady(false)
    const start = window.setTimeout(() => setLineReady(true), 40)
    const timers: number[] = []
    for (let i = 0; i <= target; i += 1) {
      timers.push(window.setTimeout(() => setRevealed(i + 1), STEP_MS * (i + 1)))
    }
    return () => {
      window.clearTimeout(start)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [target])

  const progressPct =
    FLOW.length <= 1 || target < 0
      ? 0
      : Math.min(100, (Math.max(0, revealed - 1) / (FLOW.length - 1)) * 100)

  return (
    <ol className="relative mt-6 space-y-0">
      <span aria-hidden className="pointer-events-none absolute left-[0.55rem] top-2 bottom-2 w-px bg-[var(--color-border)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute left-[0.55rem] top-2 w-px origin-top bg-[var(--color-brand)] transition-[height] duration-500 ease-out"
        style={{ height: `calc((100% - 1rem) * ${lineReady ? progressPct / 100 : 0})` }}
      />
      {FLOW.map((step, index) => {
        const done = !exception && index < active && index < revealed
        const current = !exception && index === active && revealed > active
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            <span
              className={cn(
                'relative z-10 mt-0.5 size-2.5 shrink-0 rounded-full ring-4 ring-[var(--color-bg-elevated)] transition-all duration-300',
                done || current ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]',
                current && 'nv-track-pulse',
              )}
              aria-hidden
            />
            <div>
              <p
                className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  done || current ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]',
                )}
              >
                {step.label}
              </p>
              {current ? <p className="text-xs text-[var(--color-fg-muted)]">Current status</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function ShipmentTrack({
  shipment,
  orderStatus,
  paymentStatus,
}: {
  shipment: ShipmentTrackingView
  orderStatus: string
  paymentStatus: string
}) {
  const exception = exceptionLabel(shipment.status) || exceptionLabel(orderStatus)
  const active = useMemo(
    () => activeStepIndex(orderStatus, paymentStatus, shipment),
    [orderStatus, paymentStatus, shipment],
  )

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="nv-label">Shipment</p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {[shipment.courierName, shipment.trackingNumber || shipment.awbNumber].filter(Boolean).join(' · ') ||
              'Tracking updates as your order moves'}
          </p>
        </div>
        {exception ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--color-warn)_14%,white)] px-2.5 py-1 text-xs font-medium text-[var(--color-warn)]">
            {exception}
          </span>
        ) : null}
      </div>

      <TrackingStepper active={active} exception={exception} />

      {shipment.trackingUrl ? (
        <a
          href={shipment.trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          Open carrier tracking →
        </a>
      ) : null}
    </div>
  )
}

export function OrderTrackingTimeline({
  tracking,
  orderStatus,
  paymentStatus,
}: {
  tracking?: OrderTrackingView | null
  orderStatus: string
  paymentStatus: string
}) {
  const shipments = tracking?.shipments ?? []
  const exception = exceptionLabel(orderStatus)

  if (!shipments.length) {
    const active = activeStepIndex(orderStatus, paymentStatus, null)
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
        <p className="nv-label">Order progress</p>
        <TrackingStepper active={active} exception={exception} />
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Detailed shipment tracking appears once the seller creates a shipment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => (
        <ShipmentTrack
          key={shipment.shipmentId}
          shipment={shipment}
          orderStatus={orderStatus}
          paymentStatus={paymentStatus}
        />
      ))}
    </div>
  )
}
