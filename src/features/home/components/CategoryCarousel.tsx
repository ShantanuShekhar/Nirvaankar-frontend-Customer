import type { Category } from '@/api/endpoints/commerce'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

function describe(category: Category) {
  return `Explore ${category.name.toLowerCase()} from our makers.`
}

function tone(index: number) {
  const tones = [
    'from-[#1f3d2b] to-[#3a6b4a]',
    'from-[#4a3728] to-[#b56a4a]',
    'from-[#2a5239] to-[#6b9470]',
    'from-[#1c1917] to-[#5c4634]',
  ]
  return tones[index % tones.length]
}

type Props = {
  categories: Category[]
}

export function CategoryCarousel({ categories }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const paused = useRef(false)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  function updateArrows() {
    const el = scroller.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  function scrollByCard(dir: number) {
    const el = scroller.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const amount = (card?.offsetWidth ?? 260) + 16
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    updateArrows()
    const onScroll = () => updateArrows()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [categories.length])

  useEffect(() => {
    if (categories.length < 3) return
    const id = window.setInterval(() => {
      if (paused.current) return
      const el = scroller.current
      if (!el) return
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 12) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      scrollByCard(1)
    }, 4200)
    return () => window.clearInterval(id)
  }, [categories.length])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const node = el
    let startX = 0
    let startLeft = 0
    let dragging = false

    function down(e: PointerEvent) {
      dragging = true
      paused.current = true
      startX = e.clientX
      startLeft = node.scrollLeft
      node.setPointerCapture(e.pointerId)
    }
    function move(e: PointerEvent) {
      if (!dragging) return
      node.scrollLeft = startLeft - (e.clientX - startX)
    }
    function up() {
      dragging = false
      paused.current = false
    }

    node.addEventListener('pointerdown', down)
    node.addEventListener('pointermove', move)
    node.addEventListener('pointerup', up)
    node.addEventListener('pointercancel', up)
    return () => {
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', up)
      node.removeEventListener('pointercancel', up)
    }
  }, [categories.length])

  if (!categories.length) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">Shop by category</p>
          <h2 className="mt-2 font-display text-4xl text-[var(--color-brand)]">Find what belongs with you</h2>
        </div>
        <Link
          to="/shop"
          className="text-sm font-medium text-[var(--color-brand)] underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>

      <div
        className="relative mt-8"
        onMouseEnter={() => {
          paused.current = true
        }}
        onMouseLeave={() => {
          paused.current = false
        }}
        onFocusCapture={() => {
          paused.current = true
        }}
        onBlurCapture={() => {
          paused.current = false
        }}
      >
        <div
          ref={scroller}
          className="nv-hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          role="list"
          aria-label="Product categories"
        >
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              data-card
              role="listitem"
              className="group w-[min(78vw,17.5rem)] shrink-0 snap-start sm:w-64"
            >
              <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:border-[var(--color-brand)]/30 hover:shadow-[var(--shadow-lift)]">
                <div className={`relative aspect-[5/4] overflow-hidden bg-gradient-to-br ${tone(index)}`}>
                  <svg className="absolute inset-0 h-full w-full opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-40" viewBox="0 0 200 160" aria-hidden>
                    <ellipse cx="150" cy="40" rx="50" ry="70" fill="#faf7f2" />
                    <ellipse cx="40" cy="120" rx="40" ry="28" fill="#faf7f2" />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-2xl text-[var(--color-brand)] transition-colors group-hover:text-[var(--color-forest-800)]">{category.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">{describe(category)}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous categories"
          disabled={!canPrev}
          className="absolute -left-2 top-1/3 hidden rounded-full border border-[var(--color-border)] bg-white p-2 shadow-sm disabled:opacity-30 md:inline-flex"
          onClick={() => scrollByCard(-1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next categories"
          disabled={!canNext}
          className="absolute -right-2 top-1/3 hidden rounded-full border border-[var(--color-border)] bg-white p-2 shadow-sm disabled:opacity-30 md:inline-flex"
          onClick={() => scrollByCard(1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
