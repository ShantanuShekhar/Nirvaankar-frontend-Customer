import { cn } from '@/shared/utils/helpers'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-md)] bg-[var(--color-cream-200)]', className)}
      aria-hidden
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function SectionSkeleton() {
  return (
    <div className="space-y-4 py-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  )
}

/** Generic page loading for cart/checkout/orders */
export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="nv-container space-y-4 py-12" aria-busy="true" aria-label={label}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        </div>
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  )
}

export function PdpLoading() {
  return (
    <div className="nv-container grid gap-10 py-8 lg:grid-cols-2" aria-busy="true" aria-label="Loading product">
      <Skeleton className="aspect-[4/5] w-full rounded-[var(--radius-lg)]" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 flex-1" />
        </div>
      </div>
    </div>
  )
}
