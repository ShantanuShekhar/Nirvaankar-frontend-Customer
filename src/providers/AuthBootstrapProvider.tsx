import { refreshAccessToken } from '@/api/client'
import { profileApi } from '@/api/endpoints/identity'
import { useAuthStore } from '@/store/authStore'
import { useEffect, type ReactNode } from 'react'

/**
 * On app load: try refresh with stored opaque refresh token, then hydrate user.
 * Access token never leaves memory (Zustand).
 */
export function AuthBootstrapProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped)
  const clearSession = useAuthStore((s) => s.clearSession)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const { accessToken, refreshToken } = useAuthStore.getState()
        if (!accessToken && refreshToken) {
          await refreshAccessToken()
        }
        const token = useAuthStore.getState().accessToken
        if (token) {
          const { data } = await profileApi.getMe()
          if (!cancelled) {
            setUser({
              userId: data.userId,
              email: data.email,
              phone: data.phone,
              firstName: data.firstName,
              roles: [...data.roles],
            })
          }
        }
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setBootstrapped(true)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession, setBootstrapped, setUser])

  return children
}
