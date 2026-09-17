import { WishlistToggle } from '@/features/product/components/WishlistToggle'
import type { ProductCard as ProductCardData } from '@/api/endpoints/commerce'
import { Badge } from '@/shared/ui/Badge'
import { Price } from '@/shared/ui/Price'
import { ProductImage } from '@/shared/ui/ProductImage'
import { Link } from 'react-router'

function discountPercent(priceMinor: number, compareAtMinor: number | null | undefined) {
  if (!compareAtMinor || compareAtMinor <= priceMinor) return null
  return Math.round(((compareAtMinor - priceMinor) / compareAtMinor) * 100)
}

function meaningfulBadges(badges: string[] | undefined) {
  return (badges ?? [])
    .map((b) => b.replaceAll('_', ' ').trim())
    .filter(Boolean)
    .slice(0, 2)
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const off = discountPercent(product.priceMinor, product.compareAtMinor)
  const badges = meaningfulBadges(product.badges)
  const category = product.rootCategoryName || product.categoryName

  return (
    <article className="group relative flex flex-col">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)]">
          <ProductImage
            imageUrl={product.imageUrl}
            alt={product.name}
            lazy
            className="aspect-[4/5] w-full nv-img-zoom"
          />
          {off ? (
            <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-[var(--color-forest-800)] px-2 py-1 text-[11px] font-semibold tracking-wide text-white">
              {off}% off
            </span>
          ) : null}
          {badges.length ? (
            <div className="absolute bottom-3 left-3 flex max-w-[85%] flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge} tone="brand" className="border-0 bg-white/95 text-[11px] backdrop-blur-sm">
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="mt-3.5 flex flex-1 flex-col">
        {category ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
            {category}
          </p>
        ) : null}
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="mt-1 line-clamp-2 font-display text-[1.35rem] leading-snug text-[var(--color-brand)] sm:text-2xl">
            {product.name}
          </h3>
          {product.shortDesc ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{product.shortDesc}</p>
          ) : (
            <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">{product.storeName}</p>
          )}
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-semibold text-[var(--color-forest-800)]">
              <Price amountMinor={product.priceMinor} currency={product.currency} />
            </span>
            {product.compareAtMinor && product.compareAtMinor > product.priceMinor ? (
              <span className="text-sm text-[var(--color-fg-muted)] line-through">
                MRP <Price amountMinor={product.compareAtMinor} currency={product.currency} />
              </span>
            ) : null}
          </p>
        </Link>
        <Link
          to={`/products/${product.slug}`}
          className="mt-3 inline-flex text-sm font-semibold text-[var(--color-forest-800)] underline-offset-4 opacity-0 transition group-hover:opacity-100 hover:underline sm:opacity-100"
        >
          View details →
        </Link>
      </div>

      <div className="absolute right-3 top-3 z-10 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <WishlistToggle sku={product.variantSku} className="h-10 w-10 bg-white/95 shadow-sm backdrop-blur-sm" />
      </div>
    </article>
  )
}
