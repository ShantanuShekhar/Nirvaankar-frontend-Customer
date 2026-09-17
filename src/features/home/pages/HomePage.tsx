import { BACKEND_CAPABILITIES } from '@/api/endpoints/capabilities'
import { catalogApi, type CategoryNode, type ProductCard as ProductCardData } from '@/api/endpoints/commerce'
import { CategoryCarousel } from '@/features/home/components/CategoryCarousel'
import { BringNatureHome } from '@/features/home/components/BringNatureHome'
import { ScreenRenderer } from '@/features/sdui/ScreenRenderer'
import { APP_NAME, APP_TAGLINE, APP_SUPPORTING } from '@/config/defaults'
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
    text: 'We curate goods chosen for kinder materials and mindful making — never greenwash for its own sake.',
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
    text: 'Materials, care and maker notes sit on the product page — not buried in fine print.',
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

  const roots = flattenRoots(tree.data ?? [])
  const items = products.data?.items ?? []
  const featured = items.slice(0, 8)
  const arrivals = items.slice(8, 16)
  const heroProduct = featured[0]
  const heroSrc = catalogImageSrc(heroProduct?.imageUrl)
  const materials = uniqueMaterials(items)
  const purposes = purposeLinks(items, roots)

  return (
    <div>
      <section className="relative overflow-hidden bg-[var(--color-forest-950)]">
        {heroSrc ? (
          <img
            src={heroSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40 will-change-transform [transform:translateZ(0)] motion-safe:scale-105"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(107,148,112,0.35),transparent_55%),linear-gradient(135deg,#0f2419,#1f3d2b_55%,#4a3728)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,36,25,0.94)_10%,rgba(15,36,25,0.68)_52%,rgba(15,36,25,0.4)_100%)]" />
        <div className="nv-container relative flex min-h-[86vh] flex-col justify-end pb-16 pt-28">
          <div className="relative mb-8 w-fit nv-enter">
            <BotanicalParticles />
            <BrandMark inverted />
          </div>
          <p className="nv-enter nv-enter-delay-1 nv-label !text-[var(--color-cream-200)]">{APP_NAME}</p>
          <h1 className="nv-enter nv-enter-delay-1 mt-3 max-w-3xl font-display text-5xl leading-[1.05] text-[var(--color-cream-50)] sm:text-6xl lg:text-7xl">
            {APP_TAGLINE}
          </h1>
          <p className="nv-enter nv-enter-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-cream-100)]">
            {APP_SUPPORTING}
          </p>
          <div className="nv-enter nv-enter-delay-3 mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="nv-cta inline-flex">
              <Button size="lg">Shop Now</Button>
            </Link>
            <a href="#categories" className="nv-cta inline-flex">
              <Button size="lg" variant="secondary" className="border-white/45 bg-white/10 text-white hover:bg-white/18">
                Explore Categories
              </Button>
            </a>
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
              <p className="text-sm text-[var(--color-fg-muted)]">Loading categories…</p>
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
              description="Drawn from live product badges and categories — not invented filters."
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
                      Explore →
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-[var(--color-fg-muted)]">
                Browse the collection — material details appear on each product page when available.
              </p>
            )}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="nv-container py-16">
          <SectionHeader eyebrow="Made with purpose" title="Material → Artisan → Craft → Product" />
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
                Nirvaankar brings together handmade, natural and thoughtfully made goods — so every object you
                bring home has a maker, a material, and a reason to exist.
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-forest-900)] p-8 text-[var(--color-cream-50)]">
              <p className="font-display text-3xl italic">Stories travel with every object.</p>
              <p className="mt-4 text-sm text-[var(--color-cream-200)]">
                Maker notes and materials sit first-class on the product page — never an afterthought.
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
