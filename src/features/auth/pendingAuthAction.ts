import { cartApi, checkoutApi, wishlistApi } from '@/api/endpoints/commerce'
import { PENDING_AUTH_ACTION_KEY } from '@/config/defaults'

const STORAGE_KEY = PENDING_AUTH_ACTION_KEY
const MAX_AGE_MS = 60 * 60 * 1000

export type PendingAuthActionType = 'add_to_cart' | 'buy_now' | 'wishlist'

export type PendingAuthAction = {
  type: PendingAuthActionType
  sku: string
  quantity: number
  returnTo: string
  createdAt: number
}

/** Only same-origin relative paths are accepted as return targets. */
export function safeReturnPath(value: string | null | undefined, fallback = '/shop'): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return fallback
  }
  if (trimmed === '/login' || trimmed === '/register' || trimmed.startsWith('/login?') || trimmed.startsWith('/register?')) {
    return fallback
  }
  return trimmed
}

export function savePendingAuthAction(action: Omit<PendingAuthAction, 'createdAt'>): void {
  try {
    const payload: PendingAuthAction = {
      ...action,
      returnTo: safeReturnPath(action.returnTo),
      quantity: Math.max(1, action.quantity || 1),
      createdAt: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Private mode / blocked storage — login still works without resume.
  }
}

export function readPendingAuthAction(): PendingAuthAction | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingAuthAction
    if (!parsed?.type || !parsed?.sku || typeof parsed.createdAt !== 'number') {
      clearPendingAuthAction()
      return null
    }
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      clearPendingAuthAction()
      return null
    }
    return {
      ...parsed,
      returnTo: safeReturnPath(parsed.returnTo),
      quantity: Math.max(1, parsed.quantity || 1),
    }
  } catch {
    clearPendingAuthAction()
    return null
  }
}

export function clearPendingAuthAction(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function loginPathForAction(action: Omit<PendingAuthAction, 'createdAt'>): string {
  savePendingAuthAction(action)
  const next =
    action.type === 'buy_now'
      ? '/checkout?source=buy_now'
      : action.type === 'add_to_cart'
        ? '/cart'
        : '/wishlist'
  return `/login?next=${encodeURIComponent(next)}`
}

/**
 * Runs after a successful login/register. Returns the path to navigate to.
 * Protected APIs are only called once the session token is already set.
 */
export async function resumePendingAuthAction(fallbackNext?: string | null): Promise<string> {
  const pending = readPendingAuthAction()
  const fallback = safeReturnPath(fallbackNext, '/shop')
  if (!pending) return fallback

  try {
    if (pending.type === 'add_to_cart') {
      await cartApi.add(pending.sku, pending.quantity)
      clearPendingAuthAction()
      return '/cart'
    }
    if (pending.type === 'buy_now') {
      await checkoutApi.startBuyNow(pending.sku, pending.quantity)
      clearPendingAuthAction()
      return '/checkout?source=buy_now'
    }
    if (pending.type === 'wishlist') {
      await wishlistApi.add(pending.sku)
      clearPendingAuthAction()
      return '/wishlist'
    }
  } catch {
    clearPendingAuthAction()
    return safeReturnPath(pending.returnTo, fallback)
  }

  clearPendingAuthAction()
  return fallback
}
