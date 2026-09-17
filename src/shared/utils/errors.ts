import { isApiError } from '@/api/client'

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function mapFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {}
  return Object.fromEntries(error.fieldErrors.map((item) => [item.field, item.message]))
}
