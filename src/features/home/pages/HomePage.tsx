import { BACKEND_CAPABILITIES } from '@/api/endpoints/capabilities'
import { configApi } from '@/api/endpoints/config'
import { catalogApi, type CategoryNode, type ProductCard as ProductCardData } from '@/api/endpoints/commerce'
import { CategoryCarousel } from '@/features/home/components/CategoryCarousel'
import { BringNatureHome } from '@/features/home/components/BringNatureHome'
import { ScreenRenderer } from '@/features/sdui/ScreenRenderer'
import { APP_NAME, APP_TAGLINE, APP_SUPPORTING } from '@/config/defaults'
import heroFallback from '@/assets/hero-fallback.svg'
import { BotanicalParticles } from '@/shared/ui/BotanicalParticles'
import { BrandMark } from '@/shared/ui/BrandMark'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ProductCard } from '@/shared/ui/ProductCard'
import { ProductCardSkeleton } from '@/shared/ui/Skeleton'
import { Reveal } from '@/shared/ui/Reveal'
import { SectionHeader } from '@/shared/ui/SectionHeader'
import { catalogImageSrc } from '@/shared/ui/ProductImage'
import { useQuery } from '@tanstack/react-query'
import { HandHeart, Leaf, Recycle, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

const trustStrip = [
  { icon: Leaf, label: 'Thoughtfully Sustainable' },
  { icon: HandHeart, label: 'Handcrafted' },
  { icon: Sprout, label: 'Natural Materials' },
  { icon: Recycle, label: 'Conscious Choices' },
]

const whyCards = [
  {
    title: 'Thoughtfully Sustainable',
    text: 'We curate goods chosen for kinder materials and mindful making â€” never greenwash for its own sake.',
  },
  {
    title: 'Crafted by Artisans',
    text: 'Every listing belongs to a maker or small studio. Their craft is the product story.',
  },
  {
    title: 'Better Everyday Alternatives',
    text: 'Swap disposable convenience for pieces meant to be used, cared for, and kept.',
  },
  {
    title: 'Transparent Choices',
    text: 'Materials, care and maker notes sit on the product page â€” not buried in fine print.',
  },
]

const purposeJourney = [
  { title: 'Material', text: 'Natural fibres, clay, wood and botanicals chosen with care.' },
  { title: 'Artisan', text: 'Skilled hands and small workshops behind every piece.' },
  { title: 'Crafting', text: 'Slow processes that leave room for character and quality.' },
  { title: 'Product', text: 'Objects that feel considered in your home and routine.' },
]

function flattenRoots(tree: CategoryNode[]) {
  return tree.map((n) => ({
    slug: n.slug,
    name: n.name,
    parentId: n.parentId,
    sortOrder: n.sortOrder,
  }))
}

function uniqueMaterials(products: ProductCardData[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of products) {
    for (const badge of p.badges ?? []) {
      const label = badge.replaceAll('_', ' ').trim()
      if (!label) continue
      const key = label.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(label)
      if (out.length >= 8) return out
    }
  }
  return out
}

function purposeLinks(products: ProductCardData[], roots: ReturnType<typeof flattenRoots>) {
  const badges = uniqueMaterials(products)
  if (badges.length) {
    return badges.slice(0, 5).map((b) => ({
      title: b,
      href: `/search?q=${encodeURIComponent(b)}`,
    }))
  }
  return roots.slice(0, 5).map((r) => ({
    title: r.name,
    href: `/shop?category=${encodeURIComponent(r.slug)}`,
  }))
}

/** Bold + green highlight for key words in the existing tagline. */
function HeroHeadline({ text }: { text: string }) {
  const parts = text.split(/(\bHands\b|\bNature\b)/g)
  return (
    <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
      {parts.map((part, i) =>
        part === 'Hands' || part === 'Nature' ? (
          <span key={`${part}-${i}`} className="font-semibold text-[#76D713]">
            {part}
          </span>
        ) : (
          <span key={`${part}-${i}`} className="font-semibold text-white">
            {part}
          </span>
        ),
      )}
    </h1>
  )
}

/**
 * Hero media: API/S3 stream first, then bundled fallback. Never shows a broken image.
 * GIFs stay animated via native <img>.
 */
function HeroMediaCard({ imageUrl }: { imageUrl: string | null | undefined }) {
  const remote = catalogImageSrc(imageUrl)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [remote])
  const src = remote && !failed ? remote : heroFallback
  const usedFallback = !remote || failed

  return (
    <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-none">
      {/* Soft green glow base (reference stacked-card feel, brand green) */}
      <div
        aria-hidden
        className="absolute -inset-x-4 bottom-2 top-10 rounded-[2rem] bg-[#109648]/35 blur-2xl sm:-inset-x-6"
      />
      <div
        aria-hidden
        className="absolute inset-x-3 top-6 h-[92%] rounded-[1.75rem] bg-gradient-to-br from-[#109648] via-[#1f3d2b] to-[#0f2419] opacity-90 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/40 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-[2px]">
        <div className="aspect-[4/5] w-full">
          <img
            key={src}
            src={src}
            alt={usedFallback ? 'Nature-inspired craft' : 'Featured handmade eco-friendly piece'}
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
            onError={() => {
              if (!failed) setFailed(true)
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  if (BACKEND_CAPABILITIES.sdui) {
    return <ScreenRenderer screenKey="home" />
  }
  return <MarketplaceHome />
}

function MarketplaceHome() {
  const tree = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await catalogApi.categoryTree()).data,
    staleTime: 5 * 60_000,
  })
  const products = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => (await catalogApi.products({ limit: 16 })).data,
    staleTime: 60_000,
  })
  const storeConfig = useQuery({
    queryKey: ['store-config'],
    queryFn: async () => (await configApi.store()).data,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const roots = flattenRoots(tree.data ?? [])
  const items = products.data?.items ?? []
  const featured = items.slice(0, 8)
  const arrivals = items.slice(8, 16)
  const materials = uniqueMaterials(items)
  const purposes = purposeLinks(items, roots)
  const heroImageUrl = storeConfig.isError ? null : storeConfig.data?.heroImageUrl

  return (
    <div>
      <section className="relative overflow-hidden bg-black">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(118,215,19,0.16),transparent_48%),radial-gradient(ellipse_at_bottom_left,rgba(16,150,72,0.12),transparent_42%)]"
        />
        <div className="nv-container relative grid min-h-[88vh] items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="relative z-10 max-w-xl">
            <div className="relative mb-7 w-fit nv-enter">
              <BotanicalParticles />
              <BrandMark inverted />
            </div>
            <p className="nv-enter nv-enter-delay-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#76D713]">
              {APP_NAME}
            </p>
            <div className="nv-enter nv-enter-delay-1">
              <HeroHeadline text={APP_TAGLINE} />
            </div>
            <p className="nv-enter nv-enter-delay-2 mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              {APP_SUPPORTING}
            </p>
            <div className="nv-enter nv-enter-delay-3 mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="nv-cta inline-flex">
                <Button
                  size="lg"
                  className="rounded-2xl bg-[#109648] px-7 text-white hover:bg-[#0d7d3b]"
                >
                  Shop Now
                </Button>
              </Link>
              <a href="#categories" className="nv-cta inline-flex">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  Explore Categories
                </Button>
              </a>
            </div>
          </div>

          <div className="nv-enter nv-enter-delay-2 relative z-10 lg:justify-self-end lg:w-full lg:max-w-[28rem]">
            <HeroMediaCard imageUrl={heroImageUrl} />
          </div>
        </div>
      </section>

      <Reveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <div className="nv-container grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustStrip.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={18} className="text-[var(--color-brand)]" aria-hidden />
                <p className="text-sm font-medium text-[var(--color-fg)]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="collections" className="scroll-mt-24 bg-[var(--color-cream-100)] py-16">
          <div className="nv-container">
            <SectionHeader eyebrow="Shop by intention" title="Bring Nature Home" />
            <BringNatureHome />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="categories" className="scroll-mt-24">
          {roots.length ? (
            <CategoryCarousel categories={roots} />
          ) : tree.isLoading ? (
            <div className="nv-container py-16">
              <p className="text-sm text-[var(--color-fg-muted)]">Loading categoriesâ€¦</p>
            </div>
          ) : null}
        </section>
      </Reveal>

      <section className="nv-container py-16">
        <Reveal>
          <SectionHeader
            eyebrow="Featured"
            title="Pieces we love right now"
            action={{ label: 'Shop all', to: '/shop' }}
          />
        </Reveal>
        {products.isLoading ? (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : featured.length ? (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product, i) => (
              <Reveal key={product.productId} delayMs={Math.min(i, 5) * 60}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-[var(--color-fg-muted)]">New craft is being published. Visit the shop soon.</p>
        )}
      </section>

      <Reveal>
        <section id="purpose" className="scroll-mt-24 bg-[var(--color-cream-100)] py-16">
          <div className="nv-container">
            <SectionHeader
              eyebrow="Shop by purpose"
              title="Find what fits your values"
              description="Drawn from live product badges and categories â€” not invented filters."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {purposes.map((p) => (
                <Link
                  key={p.title}
                  to={p.href}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-brand)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-sm"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {arrivals.length ? (
        <section className="nv-container py-16">
          <Reveal>
            <SectionHeader eyebrow="New arrivals" title="Just from the studio" />
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
            {arrivals.map((product, i) => (
              <Reveal key={product.productId} delayMs={Math.min(i, 4) * 70}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <Reveal>
        <section id="sustainable" className="scroll-mt-24 py-16">
          <div className="nv-container">
            <SectionHeader
              eyebrow="Sustainable materials"
              title="Materials with a story"
              description={
                materials.length
                  ? 'Shown from attributes and badges on live products.'
                  : 'Material stories appear here as products publish with material metadata.'
              }
            />
            {materials.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {materials.map((item) => (
                  <Card key={item} as="article" hover className="nv-hover-lift">
                    <h3 className="font-display text-2xl text-[var(--color-brand)]">{item}</h3>
                    <Link
                      to={`/search?q=${encodeURIComponent(item)}`}
                      className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)]"
                    >
                      Explore â†’
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-[var(--color-fg-muted)]">
                Browse the collection â€” material details appear on each product page when available.
              </p>
            )}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="nv-container py-16">
          <SectionHeader eyebrow="Made with purpose" title="Material â†’ Artisan â†’ Craft â†’ Product" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {purposeJourney.map((step, i) => (
              <article key={step.title} className="relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
                <p className="text-xs font-semibold text-[var(--color-accent)]">0{i + 1}</p>
                <h3 className="mt-2 font-display text-2xl text-[var(--color-brand)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-[var(--color-cream-100)] py-16">
          <div className="nv-container">
            <SectionHeader eyebrow="Why Nirvaankar?" title="A calmer way to shop" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {whyCards.map((item) => (
                <Card key={item.title} as="article" className="nv-hover-lift">
                  <h3 className="font-display text-2xl text-[var(--color-brand)]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="nv-container py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="nv-label">Brand story</p>
              <h2 className="mt-2 font-display text-4xl text-[var(--color-brand)]">
                A marketplace for conscious everyday choices.
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-[var(--color-fg-muted)]">
                Nirvaankar brings together handmade, natural and thoughtfully made goods â€” so every object you
                bring home has a maker, a material, and a reason to exist.
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-forest-900)] p-8 text-[var(--color-cream-50)]">
              <p className="font-display text-3xl italic">Stories travel with every object.</p>
              <p className="mt-4 text-sm text-[var(--color-cream-200)]">
                Maker notes and materials sit first-class on the product page â€” never an afterthought.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-[var(--color-forest-900)] py-20 text-[var(--color-cream-50)]">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-4xl sm:text-5xl">Choose Better. Live Naturally.</h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--color-cream-200)]">
              Explore the live collection of thoughtfully crafted goods.
            </p>
            <Link to="/shop" className="nv-cta mt-8 inline-block">
              <Button size="lg" variant="secondary" className="border-white/35 text-white hover:bg-white/10">
                Explore the Collection
              </Button>
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}

