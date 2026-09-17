import { loginPathForAction } from '@/features/auth/pendingAuthAction'
import { wishlistApi } from '@/api/endpoints/commerce'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAuthStore } from '@/store/authStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router'

type Props = {
  sku: string | undefined
  className?: string
}

export function WishlistToggle({ sku, className }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const status = useQuery({
    queryKey: ['wishlist-status', sku],
    queryFn: async () => (await wishlistApi.status(sku!)).data,
    enabled: !!accessToken && !!sku,
  })

  const toggle = useMutation({
    mutationFn: async () => {
      if (!sku) throw new Error('Select a variant first')
      if (status.data?.wishlisted) {
        return (await wishlistApi.remove(sku)).data
      }
      return (await wishlistApi.add(sku)).data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      await queryClient.invalidateQueries({ queryKey: ['wishlist-status', sku] })
    },
  })

  const wishlisted = !!status.data?.wishlisted
  const busy = (!!accessToken && status.isLoading) || toggle.isPending

  return (
    <button
      type="button"
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={wishlisted}
      disabled={busy || !sku}
      title={toggle.isError ? getErrorMessage(toggle.error) : undefined}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
        wishlisted
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
          : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-brand)] hover:border-[var(--color-accent)]'
      } ${className ?? ''}`}
      onClick={() => {
        if (!sku) return
        if (!accessToken) {
          navigate(
            loginPathForAction({
              type: 'wishlist',
              sku,
              quantity: 1,
              returnTo: window.location.pathname + window.location.search,
            }),
          )
          return
        }
        toggle.mutate()
      }}
    >
      <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
    </button>
  )
}
