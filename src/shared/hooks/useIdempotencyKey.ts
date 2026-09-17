import { createIdempotencyKey } from '@/shared/utils/helpers'
import { useRef } from 'react'

/**
 * Holds one Idempotency-Key for a logical operation across retries.
 * Reset only after success.
 */
export function useIdempotencyKey() {
  const keyRef = useRef(createIdempotencyKey())

  return {
    getKey: () => keyRef.current,
    reset: () => {
      keyRef.current = createIdempotencyKey()
    },
  }
}
