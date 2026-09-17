import type { SessionResponse, TokenResponse } from '@/api/types'
import { REFRESH_STORAGE_KEY } from '@/config/defaults'
import { create } from 'zustand'

type AuthUser = {
  userId: string
  email: string | null
  phone: string | null
  firstName: string | null
  roles: string[]
}

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  bootstrapped: boolean
  setBootstrapped: (value: boolean) => void
  setSession: (session: SessionResponse) => void
  setUser: (user: AuthUser) => void
  setTokens: (tokens: TokenResponse) => void
  clearSession: () => void
}

function readStoredRefresh(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredRefresh(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(REFRESH_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(REFRESH_STORAGE_KEY)
    }
  } catch {
    // Private mode / blocked storage — memory-only session still works.
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: readStoredRefresh(),
  user: null,
  bootstrapped: false,
  setBootstrapped: (value) => set({ bootstrapped: value }),
  setSession: (session) => {
    writeStoredRefresh(session.tokens.refreshToken)
    set({
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      user: {
        userId: session.userId,
        email: session.email,
        phone: session.phone,
        firstName: session.firstName,
        roles: session.roles,
      },
    })
  },
  setUser: (user) => set({ user }),
  setTokens: (tokens) => {
    writeStoredRefresh(tokens.refreshToken)
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  },
  clearSession: () => {
    writeStoredRefresh(null)
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))
