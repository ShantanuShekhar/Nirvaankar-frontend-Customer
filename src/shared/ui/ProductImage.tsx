import { API_BASE_URL } from '@/config/defaults'
import { useState } from 'react'

export function catalogImageSrc(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  return `${API_BASE_URL}${imageUrl}`
}

export function ProductImage({
  imageUrl,
  alt,
  className,
  lazy = true,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
}: {
  imageUrl: string | null | undefined
  alt: string
  className?: string
  lazy?: boolean
  /** Prefer for LCP / hero / primary gallery image */
  priority?: boolean
  sizes?: string
}) {
  const src = catalogImageSrc(imageUrl)
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className={`${className ?? ''} bg-[var(--color-bg-muted)]`} aria-hidden />
  }
  const eager = priority || !lazy
  return (
    <img
      src={src}
      alt={alt}
      className={`${className ?? ''} object-cover`}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  )
}
