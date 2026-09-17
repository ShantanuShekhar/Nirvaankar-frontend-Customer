import { Link } from 'react-router'
import { Button } from '@/shared/ui/Button'

export function BannerBlock({ props }: { props?: Record<string, unknown> }) {
  const title = String(props?.title ?? '')
  const subtitle = String(props?.subtitle ?? '')
  const ctaLabel = props?.ctaLabel ? String(props.ctaLabel) : null
  const ctaHref = props?.ctaHref ? String(props.ctaHref) : '/shop'

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mt-8 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-cream-100)] px-8 py-12">
        <h2 className="font-display text-4xl text-[var(--color-brand)]">{title}</h2>
        {subtitle ? <p className="mt-3 max-w-2xl text-[var(--color-fg-muted)]">{subtitle}</p> : null}
        {ctaLabel ? (
          <Link to={ctaHref} className="mt-6 inline-block">
            <Button>{ctaLabel}</Button>
          </Link>
        ) : null}
      </div>
    </section>
  )
}
