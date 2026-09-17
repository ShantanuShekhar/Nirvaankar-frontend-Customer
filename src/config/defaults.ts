export const APP_NAME = 'Nirvaankar'
export const APP_TAGLINE = 'Crafted by Hands, Inspired by Nature.'
export const APP_SUPPORTING =
  'Discover thoughtfully crafted products that bring natural materials, conscious choices and beautiful everyday living together.'
export const SUPPORT_EMAIL = 'care@nirvaankar.com'
export const SUPPORT_PHONE = '7079473505'
export const SUPPORT_PHONE_HREF = 'tel:+917079473505'

export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''

export const QUERY_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  themeStaleTime: 5 * 60_000,
  retry: 1,
} as const

export const REFRESH_STORAGE_KEY = 'nirvaankar.refreshToken'
export const DEVICE_UUID_KEY = 'nirvaankar.deviceUuid'
export const PENDING_AUTH_ACTION_KEY = 'nirvaankar.pendingAuthAction'

/** Schema-documented SDUI component types; renderer skips unknown types safely. */
export const SUPPORTED_SDUI_SCHEMA_VERSION = 1

export const FALLBACK_THEME_TOKENS = {
  global: {
    'color.bg': '#faf7f2',
    'color.bg.elevated': '#ffffff',
    'color.bg.muted': '#f3eee4',
    'color.fg': '#1c1917',
    'color.fg.muted': '#78716c',
    'color.border': '#e8e0d5',
    'color.brand': '#1f3d2b',
    'color.brand.fg': '#faf7f2',
    'color.accent': '#b56a4a',
    'color.accent.fg': '#ffffff',
    'font.display': '"Cormorant Garamond", Georgia, serif',
    'font.sans': '"Source Sans 3", system-ui, sans-serif',
    'radius.md': '0.75rem',
    'radius.lg': '1.125rem',
    'shadow.soft': '0 10px 32px rgba(31, 61, 43, 0.07)',
  },
  semantic: {
    'color.success': '#4f7a57',
    'color.warn': '#b45309',
    'color.danger': '#9b2c2c',
    'color.focus': '#6b9470',
  },
  component: {
    'color.button.primary.bg': '#2a5239',
    'color.button.primary.fg': '#ffffff',
    'color.button.secondary.bg': 'transparent',
    'color.button.secondary.fg': '#2a5239',
    'color.button.secondary.border': '#2a5239',
  },
} as const
