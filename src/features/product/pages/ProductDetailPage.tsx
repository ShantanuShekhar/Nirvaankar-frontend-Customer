import { configApi } from '@/api/endpoints/config'
import { addressApi } from '@/api/endpoints/identity'
import { catalogApi, type ProductCard as ProductCardData, type ProductDetail, type Variant } from '@/api/endpoints/commerce'
import { loginPathForAction } from '@/features/auth/pendingAuthAction'
import { ProductImageGallery } from '@/features/product/components/ProductImageGallery'
import { StarRating } from '@/features/product/components/StarRating'
import { WishlistToggle } from '@/features/product/components/WishlistToggle'
import { Badge } from '@/shared/ui/Badge'
import { Breadcrumb } from '@/shared/ui/Breadcrumb'
import { Button } from '@/shared/ui/Button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Price } from '@/shared/ui/Price'
import { ProductCard } from '@/shared/ui/ProductCard'
import { PdpLoading } from '@/shared/ui/Skeleton'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Package,
  RefreshCcw,
  Share2,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

function discountPercent(priceMinor: number, compareAtMinor: number | null | undefined) {
  if (!compareAtMinor || compareAtMinor <= priceMinor) return null
  return Math.round(((compareAtMinor - priceMinor) / compareAtMinor) * 100)
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function parseAttrs(json: string | null | undefined): Record<string, string> {
  if (!json) return {}
  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (v != null) out[k.toLowerCase()] = String(v)
    }
    return out
  } catch {
    return {}
  }
}

function variantColor(v: Variant): string | null {
  if (v.color) return v.color
  const attrs = parseAttrs(v.attributesJson)
  return attrs.color || attrs.colour || null
}

function hasColorVariants(variants: Variant[]): boolean {
  const colors = new Set(variants.map(variantColor).filter(Boolean))
  return colors.size >= 2
}

function galleryForVariant(detail: ProductDetail, selected: Variant | undefined) {
  if (selected?.images?.length) {
    return selected.images
  }
  const vid = selected?.variantId
  if (vid != null) {
    const tagged = (detail.images ?? []).filter((img) => img.variantId === vid)
    if (tagged.length) return tagged
  }
  const productWide = (detail.images ?? []).filter((img) => img.variantId == null)
  if (productWide.length) return productWide
  // Untagged multi-variant: allow browsing all images
  return detail.images ?? []
}

function Breadcrumbs({ detail }: { detail: ProductDetail }) {
  return (
    <Breadcrumb
      className="mb-6"
      items={[
        { label: 'Home', to: '/' },
        { label: 'Shop', to: '/shop' },
        ...(detail.categorySlug
          ? [{ label: detail.categoryName, to: `/shop?category=${detail.categorySlug}` }]
          : []),
        { label: detail.name },
      ]}
    />
  )
}

function ColorSwatches({
  variants,
  selectedSku,
  onSelect,
}: {
  variants: Variant[]
  selectedSku?: string
  onSelect: (sku: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        Colour:{' '}
        <span className="font-normal text-[var(--color-fg-muted)]">
          {variantColor(variants.find((v) => v.sku === selectedSku) ?? variants[0]) ?? '—'}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const color = variantColor(variant)
          const selected = variant.sku === selectedSku
          const hex = variant.colorHex
          return (
            <button
              key={variant.sku}
              type="button"
              title={`${color ?? variant.label ?? variant.sku} · ${variant.available} in stock`}
              aria-label={`Select colour ${color ?? variant.sku}`}
              aria-pressed={selected}
              disabled={!variant.active || variant.available < 1}
              onClick={() => onSelect(variant.sku)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition disabled:opacity-40 ${
                selected
                  ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/25'
                  : 'border-[var(--color-border)] hover:border-[var(--color-brand)]'
              }`}
              style={hex ? { backgroundColor: hex } : undefined}
            >
              {!hex ? (
                <span className="text-[10px] font-semibold uppercase text-[var(--color-brand)]">
                  {(color ?? variant.sku).slice(0, 2)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VariantChips({
  variants,
  selectedSku,
  onSelect,
}: {
  variants: Variant[]
  selectedSku?: string
  onSelect: (sku: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Select option</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const selected = variant.sku === selectedSku
          return (
            <button
              key={variant.sku}
              type="button"
              onClick={() => onSelect(variant.sku)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selected
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                  : 'border-[var(--color-border)] hover:border-[var(--color-brand)]'
              }`}
            >
              {variant.label ?? variant.sku}
              <span className="ml-1 opacity-75">· {variant.available} left</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PurchasePanel({
  detail,
  selected,
  onSelectVariant,
  qty,
  setQty,
  busy,
  message,
  onAddToBag,
  onBuyNow,
  purchasable,
  defaultPincode,
}: {
  detail: ProductDetail
  selected: Variant | undefined
  onSelectVariant: (sku: string) => void
  qty: number
  setQty: (n: number) => void
  busy: boolean
  message: string | null
  onAddToBag: () => void
  onBuyNow: () => void
  purchasable: boolean
  defaultPincode?: string
}) {
  const discount = selected ? discountPercent(selected.priceMinor, selected.compareAtMinor) : null
  const colorMode = hasColorVariants(detail.variants)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{detail.storeName}</Badge>
        {detail.badges?.slice(0, 2).map((badge) => (
          <Badge key={badge} tone="brand">
            {badge.replaceAll('_', ' ')}
          </Badge>
        ))}
      </div>

      <h1 className="font-display text-3xl leading-tight text-[var(--color-brand)] sm:text-4xl lg:text-[2.75rem]">
        {detail.name}
      </h1>

      {detail.shortDesc ? (
        <p className="text-[var(--color-fg-muted)] leading-relaxed">{detail.shortDesc}</p>
      ) : null}

      {detail.ratingSummary && detail.ratingSummary.totalReviews > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <StarRating rating={detail.ratingSummary.avgRating} showValue />
          <span className="text-sm text-[var(--color-fg-muted)]">
            ({detail.ratingSummary.totalReviews} review{detail.ratingSummary.totalReviews === 1 ? '' : 's'})
          </span>
          <a href="#reviews" className="text-sm text-[var(--color-accent)] hover:underline">
            See all
          </a>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-fg-muted)]">No reviews yet — be the first to review after purchase.</p>
      )}

      {selected ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-3xl font-semibold text-[var(--color-brand)]">
              <Price amountMinor={selected.priceMinor} currency={selected.currency} />
            </p>
            {selected.compareAtMinor && selected.compareAtMinor > selected.priceMinor ? (
              <>
                <p className="text-lg text-[var(--color-fg-muted)] line-through">
                  MRP <Price amountMinor={selected.compareAtMinor} currency={selected.currency} />
                </p>
                {discount ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-sm font-semibold text-white">
                    {discount}% off
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
            Inclusive of all taxes · GST {detail.gstRate}% (HSN {detail.hsnCode}) ·{' '}
            <span className={selected.available > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
              {selected.available > 0 ? `${selected.available} in stock` : 'Out of stock'}
            </span>
          </p>
        </div>
      ) : null}

      {detail.variants.length > 1 ? (
        colorMode ? (
          <ColorSwatches variants={detail.variants} selectedSku={selected?.sku} onSelect={onSelectVariant} />
        ) : (
          <VariantChips variants={detail.variants} selectedSku={selected?.sku} onSelect={onSelectVariant} />
        )
      ) : null}

      <div className="flex flex-wrap items-center gap-3" id="purchase-actions">
        <label className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm">
          Qty
          <input
            type="number"
            min={1}
            max={selected?.available ?? 1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-14 border-0 bg-transparent text-center outline-none"
            aria-label="Quantity"
          />
        </label>
        {purchasable ? (
          <Button className="min-w-[9rem] flex-1 sm:flex-none" onClick={onBuyNow} disabled={busy} loading={busy}>
            Buy Now
          </Button>
        ) : (
          <Button className="min-w-[9rem] flex-1 sm:flex-none" disabled>
            {selected ? 'Out of stock' : 'Unavailable'}
          </Button>
        )}
        <Button
          className="min-w-[9rem] flex-1 sm:flex-none"
          variant="secondary"
          onClick={onAddToBag}
          disabled={!purchasable || busy}
          loading={busy}
        >
          Add to Cart
        </Button>
      </div>

      {/* Mobile sticky purchase strip */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2">
          <Button className="flex-1" onClick={onBuyNow} disabled={!purchasable || busy} loading={busy}>
            Buy Now
          </Button>
          <Button className="flex-1" variant="secondary" onClick={onAddToBag} disabled={!purchasable || busy} loading={busy}>
            Add to Cart
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-[var(--color-brand)]">{message}</p> : null}

      {(detail.offers?.length ?? 0) > 0 ? (
        <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-bg-muted)]/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Offers</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-fg-muted)]">
            {detail.offers!.map((offer) => (
              <li key={offer}>• {offer}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <DeliveryBlock pincode={defaultPincode} />
      <PolicyStrip returnable={detail.returnable} />
    </div>
  )
}

function DeliveryBlock({ pincode }: { pincode?: string }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
      <div className="flex items-start gap-3">
        <MapPin size={18} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
        <div>
          <p className="font-medium">Delivery</p>
          {pincode ? (
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Deliver to <span className="font-medium text-[var(--color-fg)]">{pincode}</span> · Usually ships in 3–5
              business days
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              <Link to="/login" className="text-[var(--color-accent)] hover:underline">
                Sign in
              </Link>{' '}
              to check delivery to your address
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function PolicyStrip({ returnable }: { returnable: boolean }) {
  const storeConfig = useQuery({
    queryKey: ['store-config'],
    queryFn: async () => (await configApi.store()).data,
  })

  const items = useMemo(() => {
    const base = [
      { id: 'delivery', icon: Truck, label: 'Pan-India delivery' },
      { id: 'payments', icon: ShieldCheck, label: 'Secure payments' },
      { id: 'packing', icon: Package, label: 'Carefully packed' },
    ]
    const cfg = storeConfig.data
    if (!cfg?.returnEnabled) return base

    const returnLabel = returnable
      ? `${cfg.returnWindowDays}-day easy returns`
      : 'Non-returnable item'
    return [
      base[0],
      base[1],
      { id: 'return', icon: RefreshCcw, label: returnLabel },
      base[2],
    ]
  }, [returnable, storeConfig.data])

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(({ id, icon: Icon, label }) => (
        <div key={id} className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
          <Icon size={16} className="shrink-0 text-[var(--color-leaf-600)]" />
          {label}
        </div>
      ))}
    </div>
  )
}

function WhySustainable({ detail }: { detail: ProductDetail }) {
  const points = [
    detail.material ? { title: 'Natural Material', text: detail.material } : null,
    detail.makerStory ? { title: 'Thoughtfully Crafted', text: detail.makerStory } : null,
    detail.badges?.some((b) => /hand|artisan|craft/i.test(b))
      ? { title: 'Artisan Made', text: 'Made by small studios and skilled makers.' }
      : null,
    detail.badges?.some((b) => /eco|natural|sustain|plastic|reuse|durable/i.test(b))
      ? {
          title: 'Conscious Choice',
          text: detail.badges
            .filter((b) => /eco|natural|sustain|plastic|reuse|durable/i.test(b))
            .map((b) => b.replaceAll('_', ' '))
            .join(' · '),
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; text: string }>

  if (!points.length) return null

  return (
    <section className="scroll-mt-24">
      <p className="nv-label">Know what you are buying</p>
      <h2 className="mt-2 font-display text-2xl text-[var(--color-brand)]">Why is this sustainable?</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {points.map((p) => (
          <article
            key={p.title}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--color-forest-800)]">{p.title}</h3>
            <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-[var(--color-fg-muted)]">{p.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HighlightsSection({ detail }: { detail: ProductDetail }) {
  const highlights = detail.highlights?.length ? detail.highlights : detail.badges
  if (!highlights?.length) return null
  return (
    <section id="highlights" className="scroll-mt-24">
      <h2 className="font-display text-2xl text-[var(--color-brand)]">Product Highlights</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {highlights.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-fg-muted)]">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            <span className="capitalize">{item.replaceAll('_', ' ')}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MadeWithPurpose({ detail }: { detail: ProductDetail }) {
  const steps = [
    detail.material ? { title: 'Material', text: detail.material } : null,
    detail.makerStory ? { title: 'Maker', text: detail.makerStory } : null,
    detail.careInstructions ? { title: 'Care', text: detail.careInstructions } : null,
    detail.storeName ? { title: 'Studio', text: detail.storeName } : null,
  ].filter(Boolean) as Array<{ title: string; text: string }>

  if (steps.length < 2) return null

  return (
    <section className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/50 p-5 sm:p-6">
      <p className="nv-label">Made with purpose</p>
      <h2 className="mt-2 font-display text-2xl text-[var(--color-brand)]">Material → Craft → Maker → Product</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <article key={step.title}>
            <h3 className="text-sm font-semibold text-[var(--color-brand)]">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)] line-clamp-4">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function AllDetailsSection({ detail }: { detail: ProductDetail }) {
  const specs = detail.specifications ?? []
  const hasContent =
    specs.length > 0 || detail.longDesc || detail.material || detail.careInstructions || detail.makerStory
  if (!hasContent) return null

  return (
    <section id="details" className="scroll-mt-24">
      <h2 className="font-display text-2xl text-[var(--color-brand)]">All Details</h2>
      {detail.longDesc ? <p className="mt-4 text-[var(--color-fg-muted)] leading-relaxed">{detail.longDesc}</p> : null}
      {detail.makerStory ? (
        <div className="mt-6">
          <h3 className="font-medium text-[var(--color-brand)]">Maker story</h3>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)] leading-relaxed">{detail.makerStory}</p>
        </div>
      ) : null}
      {(detail.material || detail.careInstructions) && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {detail.material ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">Material</dt>
              <dd className="mt-1 text-sm">{detail.material}</dd>
            </div>
          ) : null}
          {detail.careInstructions ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">Care</dt>
              <dd className="mt-1 text-sm">{detail.careInstructions}</dd>
            </div>
          ) : null}
        </dl>
      )}
      {specs.length > 0 ? (
        <dl className="mt-6 divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
          {specs
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((spec) => (
              <div
                key={`${spec.name}-${spec.displayOrder}`}
                className="grid grid-cols-2 gap-4 px-4 py-3 text-sm sm:grid-cols-[12rem_1fr]"
              >
                <dt className="text-[var(--color-fg-muted)]">{spec.name}</dt>
                <dd className="font-medium">{spec.value}</dd>
              </div>
            ))}
        </dl>
      ) : null}
    </section>
  )
}

function SimilarProducts({ products }: { products: ProductCardData[] }) {
  if (!products.length) return null
  return (
    <section id="similar" className="scroll-mt-24">
      <h2 className="font-display text-2xl text-[var(--color-brand)]">Similar Products</h2>
      <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </section>
  )
}

function ReviewsSection({ detail }: { detail: ProductDetail }) {
  const summary = detail.ratingSummary
  const reviews = detail.reviews ?? []
  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="font-display text-2xl text-[var(--color-brand)]">Ratings &amp; Reviews</h2>
      {summary && summary.totalReviews > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
          <div className="text-center">
            <p className="text-4xl font-semibold text-[var(--color-brand)]">{summary.avgRating.toFixed(1)}</p>
            <StarRating rating={summary.avgRating} className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{summary.totalReviews} ratings</p>
          </div>
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = [summary.count5, summary.count4, summary.count3, summary.count2, summary.count1][5 - star]
              const pct = summary.totalReviews ? Math.round((count / summary.totalReviews) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8">{star} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                    <div className="h-full rounded-full bg-[var(--color-clay-500)]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[var(--color-fg-muted)]">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-fg-muted)]">Verified buyers can leave a review after delivery.</p>
      )}

      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li key={review.reviewId} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating rating={review.rating} size={14} />
                <time className="text-xs text-[var(--color-fg-muted)]" dateTime={review.createdAt}>
                  {formatReviewDate(review.createdAt)}
                </time>
              </div>
              {review.title ? <p className="mt-2 font-medium">{review.title}</p> : null}
              {review.comment ? (
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">{review.comment}</p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--color-fg-muted)]">{review.reviewerName}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label="Share product"
      title={copied ? 'Link copied' : 'Share'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-brand)] shadow backdrop-blur"
      onClick={async () => {
        const url = window.location.href
        try {
          if (navigator.share) {
            await navigator.share({ title, url })
            return
          }
        } catch {
          /* cancelled */
        }
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }}
    >
      <Share2 size={16} />
    </button>
  )
}

export function ProductDetailPage() {
  const { slugOrId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [sku, setSku] = useState<string>()
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const product = useQuery({
    queryKey: ['product', slugOrId],
    queryFn: async () => (await catalogApi.product(slugOrId!)).data,
    enabled: !!slugOrId,
  })

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await addressApi.list()).data,
    enabled: !!accessToken,
  })

  const defaultPincode = useMemo(() => {
    const list = addresses.data ?? []
    const preferred = list.find((a) => a.isDefault) ?? list[0]
    return preferred?.pincode
  }, [addresses.data])

  const selected = product.data?.variants.find((v) => v.sku === sku) ?? product.data?.variants[0]

  useEffect(() => {
    setQty(1)
  }, [selected?.sku])

  const purchasable =
    !!selected && selected.active && selected.available >= 1 && selected.priceMinor > 0

  const galleryImages = useMemo(() => {
    if (!product.data) return []
    return galleryForVariant(product.data, selected).map((img) => ({
      imageId: img.imageId,
      imageUrl: img.imageUrl,
      primary: img.primary,
      altText: img.altText,
      variantId: img.variantId,
    }))
  }, [product.data, selected])

  function requireAuth(type: 'add_to_cart' | 'buy_now') {
    if (!selected) return false
    if (accessToken) return true
    navigate(
      loginPathForAction({
        type,
        sku: selected.sku,
        quantity: qty,
        returnTo: window.location.pathname + window.location.search,
      }),
    )
    return false
  }

  async function addToBag() {
    if (!purchasable || !selected) return
    if (!requireAuth('add_to_cart')) return
    setBusy(true)
    try {
      const { cartApi } = await import('@/api/endpoints/commerce')
      await cartApi.add(selected.sku, qty)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      setMessage('Added to your bag')
    } catch (error) {
      const text = getErrorMessage(error)
      if (text.toLowerCase().includes('unauthor') || text.toLowerCase().includes('token')) {
        navigate(
          loginPathForAction({
            type: 'add_to_cart',
            sku: selected.sku,
            quantity: qty,
            returnTo: window.location.pathname + window.location.search,
          }),
        )
        return
      }
      setMessage(text)
    } finally {
      setBusy(false)
    }
  }

  async function buyNow() {
    if (!purchasable || !selected) return
    if (!requireAuth('buy_now')) return
    setBusy(true)
    try {
      const { checkoutApi } = await import('@/api/endpoints/commerce')
      await checkoutApi.startBuyNow(selected.sku, qty)
      navigate('/checkout?source=buy_now')
    } catch (error) {
      const text = getErrorMessage(error)
      if (text.toLowerCase().includes('unauthor') || text.toLowerCase().includes('token')) {
        navigate(
          loginPathForAction({
            type: 'buy_now',
            sku: selected.sku,
            quantity: qty,
            returnTo: window.location.pathname + window.location.search,
          }),
        )
        return
      }
      setMessage(text)
    } finally {
      setBusy(false)
    }
  }

  if (product.isLoading) {
    return <PdpLoading />
  }

  if (product.isError || !product.data) {
    return (
      <div className="nv-container py-8">
        <ErrorState message={getErrorMessage(product.error)} onRetry={() => product.refetch()} />
      </div>
    )
  }

  const detail = product.data

  return (
    <div className="nv-container pb-24 py-8 lg:pb-8">
      <Breadcrumbs detail={detail} />

      {/* Main PDP: sticky gallery + scrolling info column */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductImageGallery
            images={galleryImages}
            fallbackUrl={detail.imageUrl}
            alt={detail.name}
            enableHoverZoom
            overlayActions={
              <>
                <WishlistToggle sku={selected?.sku} />
                <ShareButton title={detail.name} />
              </>
            }
          />
        </div>

        <div className="min-w-0 space-y-10">
          <PurchasePanel
            detail={detail}
            selected={selected}
            onSelectVariant={setSku}
            qty={qty}
            setQty={setQty}
            busy={busy}
            message={message}
            onAddToBag={() => void addToBag()}
            onBuyNow={() => void buyNow()}
            purchasable={purchasable}
            defaultPincode={defaultPincode}
          />
          <HighlightsSection detail={detail} />
          <WhySustainable detail={detail} />
          <MadeWithPurpose detail={detail} />
          <AllDetailsSection detail={detail} />
        </div>
      </div>

      {/* Full-width sections below the two-column block */}
      <div className="mt-16 space-y-14 border-t border-[var(--color-border)] pt-14">
        <SimilarProducts products={detail.similarProducts ?? []} />
        <ReviewsSection detail={detail} />
      </div>
    </div>
  )
}
