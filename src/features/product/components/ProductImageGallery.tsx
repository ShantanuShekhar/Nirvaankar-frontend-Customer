import { catalogImageSrc } from '@/shared/ui/ProductImage'
import { ChevronLeft, ChevronRight, X, ZoomIn, ArrowLeft } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type GalleryImage = {
  imageId: number
  imageUrl: string
  primary?: boolean
  altText?: string | null
  variantId?: number | null
}

type Props = {
  images: GalleryImage[]
  fallbackUrl?: string | null
  alt: string
  overlayActions?: ReactNode
  enableHoverZoom?: boolean
}

export function ProductImageGallery({
  images,
  fallbackUrl,
  alt,
  overlayActions,
  enableHoverZoom = true,
}: Props) {
  const items = useMemo(() => {
    if (images.length > 0) return images
    if (fallbackUrl) return [{ imageId: 0, imageUrl: fallbackUrl, primary: true }]
    return []
  }, [images, fallbackUrl])

  const initialIndex = Math.max(0, items.findIndex((img) => img.primary))
  const [active, setActive] = useState(initialIndex === -1 ? 0 : initialIndex)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [failedIds, setFailedIds] = useState<Set<number>>(() => new Set())
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setActive(initialIndex === -1 ? 0 : initialIndex)
    setFailedIds(new Set())
    setZoom(null)
  }, [initialIndex, items])

  const visible = items.filter((img) => !failedIds.has(img.imageId))
  const safeActive = Math.min(active, Math.max(visible.length - 1, 0))
  const current = visible[safeActive]
  const src = catalogImageSrc(current?.imageUrl)

  const go = useCallback(
    (delta: number) => {
      if (visible.length < 2) return
      setActive((prev) => {
        const idx = Math.min(prev, visible.length - 1)
        return (idx + delta + visible.length) % visible.length
      })
    },
    [visible.length],
  )

  useEffect(() => {
    if (!lightboxOpen) return
    const previousOverflow = document.body.style.overflow
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen, go])

  function markFailed(imageId: number) {
    setFailedIds((prev) => new Set(prev).add(imageId))
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!enableHoverZoom) return
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoom({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) })
  }

  if (!current || !src) {
    return <div className="aspect-[4/5] w-full rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)]" aria-hidden />
  }

  return (
    <>
      <div className="relative space-y-3">
        <div
          className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)] shadow-[var(--shadow-soft)]"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setZoom(null)}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            const end = e.changedTouches[0]?.clientX
            touchStartX.current = null
            if (start == null || end == null) return
            const dx = end - start
            if (Math.abs(dx) < 40) return
            go(dx < 0 ? 1 : -1)
          }}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-crosshair"
            aria-label="View larger image"
            onClick={() => {
              if (!zoom) setLightboxOpen(true)
            }}
          >
            <img
              key={current.imageId}
              src={src}
              alt={current.altText || alt}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 50vw"
              onError={() => markFailed(current.imageId)}
            />
          </button>

          {zoom && enableHoverZoom ? (
            <div
              className="pointer-events-none absolute z-[5] hidden size-24 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-white/90 bg-white/10 shadow-md lg:block"
              style={{ left: `${zoom.x}%`, top: `${zoom.y}%` }}
              aria-hidden
            />
          ) : null}

          {overlayActions ? (
            <div className="absolute right-3 top-3 z-10 flex gap-2">{overlayActions}</div>
          ) : null}

          <button
            type="button"
            aria-label="Open image lightbox"
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[var(--color-brand)] shadow"
            onClick={() => setLightboxOpen(true)}
          >
            <ZoomIn size={14} />
            Enlarge
          </button>

          {visible.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--color-brand)] shadow opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--color-brand)] shadow opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
              >
                <ChevronRight size={18} />
              </button>
              <p className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
                {safeActive + 1} / {visible.length}
              </p>
            </>
          ) : null}
        </div>

        {/* Adjacent hover-zoom panel — overlays into the right column on desktop */}
        {enableHoverZoom && zoom ? (
          <div
            className="pointer-events-none absolute left-[calc(100%+1rem)] top-0 z-30 hidden h-[min(28rem,70vh)] w-[min(28rem,42vw)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)] xl:block"
            aria-hidden
          >
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${src})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '250%',
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              }}
            />
          </div>
        ) : null}

        {visible.length > 1 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {visible.map((img, index) => {
              const thumb = catalogImageSrc(img.imageUrl)
              if (!thumb) return null
              const selected = index === safeActive
              return (
                <button
                  key={img.imageId}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={selected}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                    selected
                      ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/20'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => setActive(index)}
                >
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => markFailed(img.imageId)}
                  />
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="absolute left-3 top-3 z-[101] flex gap-2 sm:left-5 sm:top-5">
            <button
              type="button"
              autoFocus
              aria-label="Close image viewer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--color-brand)] shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxOpen(false)
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              type="button"
              aria-label="Close"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-[var(--color-brand)] shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxOpen(false)
              }}
            >
              <X size={18} />
            </button>
          </div>
          {visible.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-[101] -translate-y-1/2 rounded-full bg-white/95 p-3 text-[var(--color-brand)] shadow sm:left-5"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-[101] -translate-y-1/2 rounded-full bg-white/95 p-3 text-[var(--color-brand)] shadow sm:right-5"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
              >
                <ChevronRight size={22} />
              </button>
            </>
          ) : null}
          <img
            src={src}
            alt={current.altText || alt}
            className="max-h-[82vh] max-w-[min(100%,56rem)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
