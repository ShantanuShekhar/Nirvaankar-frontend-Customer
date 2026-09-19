import { DEVICE_UUID_KEY } from '@/config/defaults'
import type { DevicePayload } from '@/api/types'
import { generateUUID } from '@/utils/uuid'

export function createIdempotencyKey(): string {
  return generateUUID()
}

export function getOrCreateDeviceUuid(): string {
  try {
    const existing = localStorage.getItem(DEVICE_UUID_KEY)
    if (existing) return existing
    const next = generateUUID()
    localStorage.setItem(DEVICE_UUID_KEY, next)
    return next
  } catch {
    return generateUUID()
  }
}

/**
 * Backend DevicePayload.model is @Size(max = 50). Never send the raw UA.
 * Example: "Chrome Windows"
 */
export function shortBrowserModel(userAgent = navigator.userAgent): string {
  const ua = userAgent
  let browser = 'Browser'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera'

  let os = 'Web'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  return `${browser} ${os}`.slice(0, 50)
}

/**
 * Normalize Indian / E.164 phone input for the backend pattern
 * `^\\+[1-9]\\d{7,14}$`.
 *
 * Accepts: 7079473505, 07079473505, 917079473505, +917079473505
 * → +917079473505
 */
export function toE164Phone(raw: string, defaultCountryCode = '91'): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) {
    const rest = digits.slice(1).replace(/\D/g, '')
    if (/^[1-9]\d{7,14}$/.test(rest)) return `+${rest}`
    return null
  }

  const onlyDigits = digits.replace(/\D/g, '')

  // 10-digit Indian mobile
  if (/^[6-9]\d{9}$/.test(onlyDigits)) {
    return `+${defaultCountryCode}${onlyDigits}`
  }

  // leading 0 + 10-digit Indian mobile
  if (/^0[6-9]\d{9}$/.test(onlyDigits)) {
    return `+${defaultCountryCode}${onlyDigits.slice(1)}`
  }

  // already includes country code without +
  if (onlyDigits.startsWith(defaultCountryCode) && onlyDigits.length >= 11 && onlyDigits.length <= 15) {
    const national = onlyDigits.slice(defaultCountryCode.length)
    if (national.length >= 7 && national.length <= 14) {
      return `+${onlyDigits}`
    }
  }

  // generic international without +
  if (/^[1-9]\d{7,14}$/.test(onlyDigits)) {
    return `+${onlyDigits}`
  }

  return null
}

export function isE164Phone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

/** Soft check: email-like → leave as-is; phone-like → E.164. */
export function normalizeLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) return trimmed
  const asPhone = toE164Phone(trimmed)
  return asPhone ?? trimmed
}

export function buildWebDevicePayload(): DevicePayload {
  return {
    deviceUuid: getOrCreateDeviceUuid(),
    platform: 'web',
    appVersion: '0.1.0',
    locale: (navigator.language || 'en-IN').slice(0, 50),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone.slice(0, 50),
    model: shortBrowserModel(),
  }
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function tokenKeyToCssVar(key: string): string {
  return `--${key.replace(/\./g, '-')}`
}

export function flattenThemeTokens(
  layers: Record<string, Record<string, string>>,
): Record<string, string> {
  const flat: Record<string, string> = {}
  for (const layer of Object.values(layers)) {
    for (const [key, value] of Object.entries(layer)) {
      flat[tokenKeyToCssVar(key)] = value
    }
  }
  return flat
}
