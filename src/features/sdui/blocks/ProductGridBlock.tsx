import { EmptyState } from '@/shared/ui/EmptyState'

/** Reserved for when catalog APIs return collection payloads for SDUI. */
export function ProductGridBlock({ props }: { props?: Record<string, unknown> }) {
  const title = String(props?.title ?? 'Products')
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="mb-6 font-display text-3xl text-[var(--color-brand)]">{title}</h2>
      <EmptyState
        title="Catalog not connected"
        description="Product grids will render here once catalog REST endpoints are available. No placeholder products are shown."
      />
    </section>
  )
}
