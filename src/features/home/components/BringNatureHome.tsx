import { catalogApi, type ShoppingIntention } from '@/api/endpoints/commerce'
import { ProductImage, catalogImageSrc } from '@/shared/ui/ProductImage'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

const SUPPORT: Record<string, string> = {
  handcrafted: 'Made by skilled hands and small studios.',
  'eco-friendly': 'Kinder materials for everyday living.',
  upcycled: 'Given a second life with care.',
  'cruelty-free': 'Conscious choices without compromise.',
  'organic-heritage': 'Rooted in natural heritage crafts.',
}

/**
 * Bring Nature Home — shopping intentions from dedicated API + S3 image_key stream.
 */
export function BringNatureHome() {
  const intentions = useQuery({
    queryKey: ['shopping-intentions'],
    queryFn: async () => (await catalogApi.shoppingIntentions()).data,
    staleTime: 5 * 60_000,
  })

  const items = intentions.data ?? []

  if (intentions.isLoading) {
    return (
      <div className="mt-8 flex gap-4 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-56 min-w-[14rem] flex-1 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)]"
          />
        ))}
      </div>
    )
  }

  if (intentions.isError) {
    return (
      <p className="mt-8 text-sm text-[var(--color-fg-muted)]">
        Intentions could not be loaded. Please try again shortly.
      </p>
    )
  }

  if (!items.length) {
    return (
      <p className="mt-8 text-sm text-[var(--color-fg-muted)]">
        Shopping intentions will appear here when published.
      </p>
    )
  }

  return (
    <div className="mt-8 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5">
      {items.map((intention) => (
        <IntentionCard key={intention.slug} intention={intention} />
      ))}
    </div>
  )
}

function IntentionCard({ intention }: { intention: ShoppingIntention }) {
  const imageUrl = intention.imageUrl
  const resolved = catalogImageSrc(imageUrl)
  const support = SUPPORT[intention.slug]

  return (
    <Link
      to={`/shop?intention=${encodeURIComponent(intention.slug)}`}
      className="group flex w-[78vw] max-w-[18rem] shrink-0 flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-forest-800)] sm:w-auto sm:max-w-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-bg-muted)] sm:aspect-[3/4]">
        {resolved ? (
          <ProductImage
            imageUrl={imageUrl}
            alt={intention.name}
            lazy
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 20vw"
            className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="h-full w-full bg-[linear-gradient(145deg,var(--color-cream-100),var(--color-brand-soft)_45%,color-mix(in_srgb,var(--color-forest-800)_28%,var(--color-cream-100)))]"
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(15,36,25,0.5)_0%,transparent_50%)] opacity-85 transition-opacity duration-200 group-hover:opacity-95"
          aria-hidden
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-2xl leading-tight text-[var(--color-brand)]">{intention.name}</h3>
        {support ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{support}</p>
        ) : null}
        <span className="mt-auto pt-3 text-sm font-semibold text-[var(--color-forest-800)] transition-transform duration-200 group-hover:translate-x-0.5">
          Explore →
        </span>
      </div>
    </Link>
  )
}
