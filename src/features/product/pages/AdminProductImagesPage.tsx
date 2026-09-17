import { adminCatalogApi, type AdminProductRow } from '@/api/endpoints/commerce'
import { ErrorState } from '@/shared/ui/ErrorState'
import { ProductImage } from '@/shared/ui/ProductImage'
import { getErrorMessage } from '@/shared/utils/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

function ProductImageRow({ product }: { product: AdminProductRow }) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [makePrimary, setMakePrimary] = useState(false)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    await queryClient.invalidateQueries({ queryKey: ['product'] })
  }

  const upload = useMutation({
    mutationFn: (file: File) => adminCatalogApi.uploadImage(product.slug, file, makePrimary),
    onSuccess: async (response) => {
      setMessage(`Added ${response.data.imageKey}${response.data.primary ? ' (primary)' : ''}`)
      await refresh()
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })

  const setPrimary = useMutation({
    mutationFn: (imageId: number) => adminCatalogApi.setPrimary(product.slug, imageId),
    onSuccess: async () => {
      setMessage('Primary image updated')
      await refresh()
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: (imageId: number) => adminCatalogApi.deleteImage(product.slug, imageId),
    onSuccess: async () => {
      setMessage('Image removed')
      await refresh()
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })

  const images = product.images ?? []

  return (
    <article className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-[var(--color-fg-muted)]">{product.slug}</p>
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
            {images.length} image{images.length === 1 ? '' : 's'}
            {product.imageKey ? ` · primary ${product.imageKey}` : ' · no primary yet'}
          </p>
          {message ? <p className="mt-1 text-sm">{message}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
            <input
              type="checkbox"
              checked={makePrimary}
              onChange={(e) => setMakePrimary(e.target.checked)}
            />
            Set as primary
          </label>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-[var(--radius-md)] bg-[var(--color-button-primary-bg)] px-3 text-sm font-medium text-[var(--color-button-primary-fg)]">
            {upload.isPending ? 'Uploading…' : 'Add image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={upload.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) upload.mutate(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      {images.length === 0 ? (
        <ProductImage
          imageUrl={product.imageUrl}
          alt={product.name}
          className="h-20 w-16 rounded bg-[var(--color-bg-muted)]"
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div
              key={img.imageId}
              className={`w-28 space-y-2 rounded border p-2 ${
                img.primary ? 'border-[var(--color-brand)]' : 'border-[var(--color-border)]'
              }`}
            >
              <ProductImage
                imageUrl={img.imageUrl}
                alt={product.name}
                className="aspect-square w-full rounded bg-[var(--color-bg-muted)]"
              />
              <p className="truncate font-mono text-[10px] text-[var(--color-fg-muted)]">{img.imageKey}</p>
              <div className="flex flex-col gap-1">
                {!img.primary ? (
                  <button
                    type="button"
                    className="text-left text-xs underline"
                    disabled={setPrimary.isPending}
                    onClick={() => setPrimary.mutate(img.imageId)}
                  >
                    Make primary
                  </button>
                ) : (
                  <span className="text-xs text-[var(--color-accent)]">Primary</span>
                )}
                <button
                  type="button"
                  className="text-left text-xs text-[var(--color-danger)] underline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(img.imageId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function AdminProductImagesPage() {
  const products = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await adminCatalogApi.products()).data,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Admin</p>
        <h1 className="font-display text-4xl text-[var(--color-brand)]">Product images</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Upload multiple images per product to private S3 (<code>products/</code>). Listing uses the
          primary image; the product page shows the full gallery.
        </p>
        <Link to="/account" className="mt-2 inline-block text-sm underline">
          Back to account
        </Link>
      </div>
      {products.isLoading ? <p>Loading products…</p> : null}
      {products.isError ? (
        <ErrorState message={getErrorMessage(products.error)} onRetry={() => products.refetch()} />
      ) : null}
      <div className="space-y-3">
        {products.data?.map((product) => (
          <ProductImageRow key={product.productId} product={product} />
        ))}
      </div>
    </div>
  )
}
