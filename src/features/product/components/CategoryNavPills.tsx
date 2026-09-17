import type { CategoryNode } from '@/api/endpoints/commerce'
import { catalogApi } from '@/api/endpoints/commerce'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

type Props = {
  selectedSlug?: string | null
}

const CLOSE_DELAY_MS = 220

function collectSlugs(node: CategoryNode): string[] {
  return [node.slug, ...(node.children ?? []).flatMap(collectSlugs)]
}

function findAncestorRoot(roots: CategoryNode[], slug: string | null | undefined): CategoryNode | null {
  if (!slug) return null
  for (const root of roots) {
    if (collectSlugs(root).includes(slug)) return root
  }
  return null
}

export function CategoryNavPills({ selectedSlug }: Props) {
  const navigate = useNavigate()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tree = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await catalogApi.categoryTree()).data,
    staleTime: 5 * 60_000,
  })

  const roots = tree.data ?? []
  const activeRoot = useMemo(() => findAncestorRoot(roots, selectedSlug), [roots, selectedSlug])

  const [hoveredRootId, setHoveredRootId] = useState<number | null>(null)
  const [hoveredSubId, setHoveredSubId] = useState<number | null>(null)

  const hoveredRoot = roots.find((r) => r.id === hoveredRootId) ?? null
  const hoveredSub = hoveredRoot?.children?.find((c) => c.id === hoveredSubId) ?? null
  const previewSlug = hoveredSub?.slug ?? hoveredRoot?.slug

  const preview = useQuery({
    queryKey: ['category-nav-preview', previewSlug],
    queryFn: async () => (await catalogApi.products({ category: previewSlug, limit: 6 })).data,
    enabled: !!previewSlug && hoveredRootId != null && hoveredSubId != null,
    staleTime: 30_000,
  })

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function scheduleClose() {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      setHoveredRootId(null)
      setHoveredSubId(null)
      closeTimer.current = null
    }, CLOSE_DELAY_MS)
  }

  function closeMenu() {
    cancelClose()
    setHoveredRootId(null)
    setHoveredSubId(null)
  }

  function openRoot(rootId: number) {
    cancelClose()
    setHoveredRootId(rootId)
    setHoveredSubId(null)
  }

  const pillClass = (active: boolean) =>
    `inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
      active
        ? 'border-[var(--color-forest-800)] bg-[var(--color-forest-800)] text-white shadow-sm'
        : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)] hover:border-[var(--color-forest-800)]/40 hover:bg-[var(--color-action-soft)]'
    }`

  function go(slug: string) {
    closeMenu()
    navigate(`/shop?category=${encodeURIComponent(slug)}`)
  }

  const showPanel = hoveredRoot && (hoveredRoot.children?.length ?? 0) > 0

  return (
    <div className="relative mt-6" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
      <div className="flex flex-wrap gap-2" role="navigation" aria-label="Categories">
        <Link to="/shop" className={pillClass(!selectedSlug)} onClick={closeMenu}>
          All
        </Link>
        {roots.map((root) => {
          const active = activeRoot?.id === root.id
          return (
            <div key={root.id} className="relative" onMouseEnter={() => openRoot(root.id)}>
              <button
                type="button"
                className={pillClass(active)}
                aria-expanded={hoveredRootId === root.id}
                aria-haspopup="true"
                onClick={() => go(root.slug)}
              >
                {root.name}
              </button>
            </div>
          )
        })}
      </div>

      {showPanel ? (
        <div className="absolute left-0 right-0 z-40 pt-3">
          <div className="grid gap-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-lift)] md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
            <ul className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)]/60 p-2 md:border-b-0 md:border-r">
              {hoveredRoot!.children.map((sub) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      hoveredSubId === sub.id
                        ? 'bg-white font-medium text-[var(--color-brand)] shadow-sm'
                        : 'text-[var(--color-fg)] hover:bg-white/80'
                    }`}
                    onMouseEnter={() => setHoveredSubId(sub.id)}
                    onClick={() => go(sub.slug)}
                  >
                    {sub.name}
                  </button>
                </li>
              ))}
            </ul>

            <div className="min-h-[8rem] p-4">
              {hoveredSub ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                    {hoveredSub.name}
                  </p>
                  {preview.isLoading ? (
                    <p className="mt-3 text-sm text-[var(--color-fg-muted)]">Loading products…</p>
                  ) : (preview.data?.items?.length ?? 0) > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {preview.data!.items.slice(0, 6).map((p) => (
                        <li key={p.productId}>
                          <Link
                            to={`/products/${p.slug}`}
                            className="block truncate text-sm text-[var(--color-fg)] hover:text-[var(--color-brand)]"
                            onClick={closeMenu}
                          >
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--color-fg-muted)]">No products in this category yet.</p>
                  )}
                  {previewSlug ? (
                    <button
                      type="button"
                      className="mt-4 text-sm font-medium text-[var(--color-brand)] underline-offset-4 hover:underline"
                      onClick={() => go(previewSlug)}
                    >
                      View all →
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
