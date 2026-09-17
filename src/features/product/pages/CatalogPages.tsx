import { catalogApi } from '@/api/endpoints/commerce'
import { CategoryNavPills } from '@/features/product/components/CategoryNavPills'
import { Breadcrumb } from '@/shared/ui/Breadcrumb'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { ProductCard } from '@/shared/ui/ProductCard'
import { ProductCardSkeleton } from '@/shared/ui/Skeleton'
import { getErrorMessage } from '@/shared/utils/errors'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

export function ShopPage() {
  const [params] = useSearchParams()
  const { slug: categorySlug } = useParams()
  const q = params.get('q') ?? undefined
  const category = params.get('category') ?? categorySlug
  const intention = params.get('intention') ?? undefined

  const tree = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await catalogApi.categoryTree()).data,
    staleTime: 5 * 60_000,
  })

  const intentions = useQuery({
    queryKey: ['shopping-intentions'],
    queryFn: async () => (await catalogApi.shoppingIntentions()).data,
    staleTime: 5 * 60_000,
    enabled: !!intention,
  })

  const feed = useInfiniteQuery({
    queryKey: ['products', category, intention, q],
    queryFn: async ({ pageParam }) => {
      if (intention) {
        return (await catalogApi.intentionProducts(intention, { cursor: pageParam, limit: 12 })).data
      }
      return (await catalogApi.products({ category, q, cursor: pageParam, limit: 12 })).data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  })
  const items = feed.data?.pages.flatMap((page) => page.items) ?? []

  const activeIntention = intentions.data?.find((i) => i.slug === intention)

  const activeName = (() => {
    if (activeIntention) return activeIntention.name
    if (!category || !tree.data) return null
    const stack = [...tree.data]
    while (stack.length) {
      const node = stack.pop()!
      if (node.slug === category) return node.name
      stack.push(...(node.children ?? []))
    }
    return category
  })()

  return (
    <div className="nv-container py-14">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(activeName ? [{ label: activeName }] : []),
        ]}
      />
      <p className="mt-8 nv-label">{intention ? 'Intention' : activeName ? 'Collection' : 'Shop'}</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl text-[var(--color-brand)] lg:text-4xl">
        {activeName ? (
          activeName
        ) : (
          <>
            <span className="text-[#1A1A1A]">All </span>
            <span className="bg-gradient-to-r from-[#109648] to-[#76D713] bg-clip-text text-transparent font-semibold">
              Products
            </span>
          </>
        )}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-fg-muted)]">
        {intention
          ? `Thoughtfully made pieces linked to ${activeName ?? 'this intention'}.`
          : activeName
            ? `A curated edit of thoughtfully made pieces in ${activeName}.`
            : 'Discover thoughtfully crafted products that are kinder to people, artisans and the planet.'}
      </p>
      {!intention ? <CategoryNavPills selectedSlug={category} /> : null}

      {feed.isLoading ? (
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      ) : null}
      {feed.isError ? (
        <ErrorState className="mt-12" message={getErrorMessage(feed.error)} onRetry={() => feed.refetch()} />
      ) : null}
      {!feed.isLoading && items.length === 0 ? (
        <EmptyState
          className="mt-12"
          title="No products match your current selection."
          description="Try another category or clear filters to see the full collection."
          action={
            <a href="/shop">
              <Button variant="secondary">Clear Filters</Button>
            </a>
          }
        />
      ) : null}
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
      {feed.hasNextPage ? (
        <div className="mt-14 text-center">
          <Button variant="secondary" loading={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function CategoryPage() {
  return <ShopPage />
}

export { ProductDetailPage } from '@/features/product/pages/ProductDetailPage'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    const next = draft.trim()
    if (next === q) return
    const handle = window.setTimeout(() => {
      setParams(next ? { q: next } : {})
    }, 1000)
    return () => window.clearTimeout(handle)
  }, [draft, q, setParams])

  return (
    <div className="nv-container py-12">
      <p className="nv-label">Search</p>
      <h1 className="mt-2 font-display text-5xl text-[var(--color-brand)]">Find something considered</h1>
      <form
        className="mt-8 flex h-12 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 shadow-[var(--shadow-soft)]"
        onSubmit={(e) => {
          e.preventDefault()
          setParams(draft.trim() ? { q: draft.trim() } : {})
        }}
      >
        <Search size={18} className="text-[var(--color-fg-muted)]" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search handmade, natural, eco…"
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
        {draft ? (
          <button
            type="button"
            aria-label="Clear search"
            className="rounded-full p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]"
            onClick={() => {
              setDraft('')
              setParams({})
            }}
          >
            <X size={16} />
          </button>
        ) : null}
        <Button type="submit" size="sm" className="shrink-0 rounded-full">
          Search
        </Button>
      </form>
      {q ? <ShopResults q={q} /> : null}
    </div>
  )
}

function ShopResults({ q }: { q: string }) {
  const feed = useQuery({
    queryKey: ['search', q],
    queryFn: async () => (await catalogApi.products({ q, limit: 24 })).data,
  })
  if (feed.isLoading) return <p className="mt-8 text-[var(--color-fg-muted)]">Searching…</p>
  if (!feed.data?.items.length) {
    return (
      <EmptyState
        className="mt-8"
        title="No matches"
        description="Try another word from the craft."
        action={
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go back
          </Button>
        }
      />
    )
  }
  return (
    <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
      {feed.data.items.map((product) => (
        <ProductCard key={product.productId} product={product} />
      ))}
    </div>
  )
}
