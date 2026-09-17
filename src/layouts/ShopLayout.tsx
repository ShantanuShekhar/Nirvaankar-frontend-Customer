import { catalogApi, type ProductCard } from '@/api/endpoints/commerce'
import { authApi } from '@/api/endpoints/identity'
import { AccountMenu } from '@/layouts/AccountMenu'
import { CustomerCareLink } from '@/layouts/CustomerCareLink'
import { APP_NAME } from '@/config/defaults'
import { BrandMark } from '@/shared/ui/BrandMark'
import { BotanicalParticles } from '@/shared/ui/BotanicalParticles'
import { Button } from '@/shared/ui/Button'
import { Price } from '@/shared/ui/Price'
import { ProductImage } from '@/shared/ui/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useQuery } from '@tanstack/react-query'
import { Heart, LogOut, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wide transition ${isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]'}`

function HeaderSearch({ className }: { className?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(() =>
    location.pathname === '/search' ? (params.get('q') ?? '') : '',
  )
  const [suggestions, setSuggestions] = useState<ProductCard[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (location.pathname === '/search') setQuery(params.get('q') ?? '')
  }, [location.pathname, params])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    const handle = window.setTimeout(() => {
      void catalogApi
        .products({ q, limit: 6 })
        .then(({ data }) => {
          setSuggestions(data.items ?? [])
          setOpen(true)
        })
        .finally(() => setLoading(false))
    }, 1000)
    return () => window.clearTimeout(handle)
  }, [query])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    setOpen(false)
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <form
      ref={boxRef}
      role="search"
      onSubmit={submit}
      className={`relative flex h-12 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 shadow-[var(--shadow-soft)] transition focus-within:border-[var(--color-forest-800)]/40 focus-within:shadow-[var(--shadow-lift)] ${className ?? ''}`}
    >
      <Search size={16} className="shrink-0 text-[var(--color-fg-muted)]" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        placeholder="Search thoughtfully made goods…"
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={open}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-fg-muted)]"
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          className="rounded-full p-0.5 text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]"
          onClick={() => {
            setQuery('')
            setSuggestions([])
            setOpen(false)
            if (location.pathname === '/search') navigate('/search')
          }}
        >
          <X size={14} />
        </button>
      ) : null}
      {open && (suggestions.length > 0 || loading) ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lift)]">
          {loading && !suggestions.length ? (
            <p className="px-4 py-3 text-sm text-[var(--color-fg-muted)]">Searching…</p>
          ) : (
            <ul>
              {suggestions.map((p) => (
                <li key={p.productId}>
                  <Link
                    to={`/products/${p.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-bg-muted)]"
                    onClick={() => setOpen(false)}
                  >
                    <ProductImage
                      imageUrl={p.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg bg-[var(--color-bg-muted)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-fg)]">{p.name}</p>
                      <p className="truncate text-xs text-[var(--color-fg-muted)]">
                        {[p.rootCategoryName || p.categoryName, p.storeName].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--color-brand)]">
                      <Price amountMinor={p.priceMinor} currency={p.currency} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="submit"
            className="w-full border-t border-[var(--color-border)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-forest-800)] hover:bg-[var(--color-action-soft)]"
          >
            View all results{query.trim() ? ` for “${query.trim()}”` : ''}
          </button>
        </div>
      ) : null}
    </form>
  )
}

function CategoriesNav() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tree = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await catalogApi.categoryTree()).data,
    staleTime: 5 * 60_000,
  })
  const roots = tree.data ?? []

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  function scheduleClose() {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 220)
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
    >
      <NavLink to="/shop" className={navLinkClass}>
        Categories
      </NavLink>
      {open && roots.length > 0 ? (
        <div className="absolute left-0 top-full z-50 pt-3">
          <div className="min-w-[16rem] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 shadow-[var(--shadow-lift)]">
            {roots.map((root) => (
              <Link
                key={root.id}
                to={`/shop?category=${encodeURIComponent(root.slug)}`}
                className="block rounded-xl px-3 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-brand)]"
                onClick={() => setOpen(false)}
              >
                {root.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileAccountActions({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const firstName = useAuthStore((s) => s.user?.firstName)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    onNavigate()
    setSigningOut(true)
    try {
      if (refreshToken) await authApi.logout({ refreshToken })
    } finally {
      clearSession()
      setSigningOut(false)
      navigate('/login')
    }
  }

  if (!accessToken) {
    return (
      <NavLink to="/login" className={navLinkClass} onClick={onNavigate}>
        Sign in
      </NavLink>
    )
  }

  return (
    <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
        {firstName ? `Hi, ${firstName}` : 'Account'}
      </p>
      <NavLink to="/account" className={navLinkClass} onClick={onNavigate}>
        <span className="inline-flex items-center gap-2">
          <User size={16} aria-hidden />
          My Profile
        </span>
      </NavLink>
      <NavLink to="/orders" className={navLinkClass} onClick={onNavigate}>
        <span className="inline-flex items-center gap-2">
          <Package size={16} aria-hidden />
          Orders
        </span>
      </NavLink>
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm tracking-wide text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand)] disabled:opacity-60"
        disabled={signingOut}
        onClick={() => void handleSignOut()}
      >
        <LogOut size={16} aria-hidden />
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  )
}

export function ShopLayout() {
  const open = useUiStore((s) => s.mobileNavOpen)
  const setOpen = useUiStore((s) => s.setMobileNavOpen)
  const accessToken = useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded bg-white px-3 py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/70 bg-[color-mix(in_srgb,var(--color-cream-50)_88%,transparent)] backdrop-blur-lg">
        <div className="nv-container flex min-h-[var(--header-height)] items-center justify-between gap-3 py-2.5 lg:gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-[var(--radius-md)] p-2 text-[var(--color-brand)] transition hover:bg-[var(--color-action-soft)] lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" className="relative group flex min-w-0 items-center" aria-label={`${APP_NAME} home`}>
              <BotanicalParticles className="hidden sm:block" />
              <BrandMark />
            </Link>
          </div>

          <nav className="hidden items-center gap-8 xl:flex" aria-label="Primary">
            <CategoriesNav />
            <NavLink to="/shop" className={navLinkClass}>
              Shop
            </NavLink>
            <a href="/#collections" className="text-sm tracking-wide text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand)]">
              Collections
            </a>
            <a href="/#sustainable" className="text-sm tracking-wide text-[var(--color-fg-muted)] transition hover:text-[var(--color-brand)]">
              Sustainable
            </a>
          </nav>

          <HeaderSearch className="hidden min-w-0 flex-1 max-w-lg md:flex" />

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              className="rounded-[var(--radius-md)] p-2 text-[var(--color-brand)] transition hover:bg-[var(--color-action-soft)] md:hidden"
              aria-label="Search"
              onClick={() => navigate('/search')}
            >
              <Search size={20} />
            </button>
            <CustomerCareLink className="hidden sm:inline-flex" />
            <Link
              to="/wishlist"
              className="hidden rounded-[var(--radius-md)] p-2 text-[var(--color-brand)] transition hover:bg-[var(--color-action-soft)] sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart size={20} />
            </Link>
            <Link
              to="/cart"
              className="rounded-[var(--radius-md)] p-2 text-[var(--color-brand)] transition hover:bg-[var(--color-action-soft)]"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
            </Link>
            <AccountMenu />
            {!accessToken ? (
              <Button size="sm" className="ml-1.5 hidden sm:inline-flex" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            ) : null}
          </div>
        </div>

        {open ? (
          <nav className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 lg:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-3">
              <NavLink to="/shop" className={navLinkClass} onClick={() => setOpen(false)}>
                Shop
              </NavLink>
              <NavLink to="/search" className={navLinkClass} onClick={() => setOpen(false)}>
                Search
              </NavLink>
              <a href="/#collections" className="text-sm tracking-wide text-[var(--color-fg-muted)]" onClick={() => setOpen(false)}>
                Collections
              </a>
              <a href="/#sustainable" className="text-sm tracking-wide text-[var(--color-fg-muted)]" onClick={() => setOpen(false)}>
                Sustainable
              </a>
              <NavLink to="/wishlist" className={navLinkClass} onClick={() => setOpen(false)}>
                Wishlist
              </NavLink>
              <CustomerCareLink showLabel className="!px-0 py-1" />
              <MobileAccountActions onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        ) : null}
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-forest-950)] text-[var(--color-cream-100)]">
        <div className="nv-container grid gap-10 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandMark inverted />
            <p className="mt-3 max-w-md text-[var(--color-cream-200)]">
              A marketplace for thoughtfully crafted products that are kinder to people, artisans and the planet.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-cream-200)]">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/shop">Shop</Link>
              </li>
              <li>
                <Link to="/search">Search</Link>
              </li>
              <li>
                <Link to="/account">Account</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-cream-200)]">Care</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="mailto:care@nirvaankar.com">care@nirvaankar.com</a>
              </li>
              <li>Ethical sourcing</li>
              <li>Conscious packaging</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-[var(--color-cream-200)]">
          © {new Date().getFullYear()} {APP_NAME}. Handmade with intention.
        </div>
      </footer>
    </div>
  )
}
