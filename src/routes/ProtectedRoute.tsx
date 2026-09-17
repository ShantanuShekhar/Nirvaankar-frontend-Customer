import { Navigate, Outlet, useLocation } from 'react-router'
import { safeReturnPath } from '@/features/auth/pendingAuthAction'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const accessToken = useAuthStore((s) => s.accessToken)
  const location = useLocation()

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--color-fg-muted)]">
        Preparing your session…
      </div>
    )
  }

  if (!accessToken) {
    const next = safeReturnPath(location.pathname + location.search, '/shop')
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return <Outlet />
}
