import { authApi } from '@/api/endpoints/identity'
import { useAuthStore } from '@/store/authStore'
import { LogOut, Package, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

const menuItemClass =
  'flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--color-fg)] transition hover:bg-[var(--color-bg-muted)]'

export function AccountMenu() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [open, setOpen] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const visible = open || hovering

  useEffect(() => {
    if (!visible) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setHovering(false)
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setHovering(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [visible])

  async function handleSignOut() {
    setOpen(false)
    setHovering(false)
    setSigningOut(true)
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken })
      }
    } finally {
      clearSession()
      setSigningOut(false)
      navigate('/login')
    }
  }

  if (!accessToken) {
    return (
      <Link
        to="/login"
        className="rounded p-2 text-[var(--color-brand)]"
        aria-label="Sign in"
      >
        <User size={20} />
      </Link>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 rounded p-2 text-[var(--color-brand)] transition hover:bg-[var(--color-bg-muted)]"
        aria-label="Account menu"
        aria-expanded={visible}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <User size={20} />
        <span className="hidden max-w-28 truncate text-sm text-[var(--color-fg-muted)] lg:inline">
          {user?.firstName?.trim() || 'You'}
        </span>
      </button>

      {visible ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-1 shadow-[var(--shadow-soft)]"
        >
          <p className="px-3 py-2 text-xs text-[var(--color-fg-muted)]">
            {user?.firstName ? `Hi, ${user.firstName}` : 'Your account'}
          </p>
          <div className="border-t border-[var(--color-border)] px-1 py-1">
            <Link
              to="/account"
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                setOpen(false)
                setHovering(false)
              }}
            >
              <User size={16} aria-hidden />
              My Profile
            </Link>
            <Link
              to="/orders"
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                setOpen(false)
                setHovering(false)
              }}
            >
              <Package size={16} aria-hidden />
              Orders
            </Link>
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-left disabled:opacity-60`}
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              <LogOut size={16} aria-hidden />
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
