import { addressApi } from '@/api/endpoints/identity'
import {
  assertRazorpayCheckout,
  cartApi,
  checkoutApi,
  paymentApi,
  wishlistApi,
  type CartView,
  type OrderView,
  type PaymentStart,
  type PriceBreakdown,
  type Totals,
} from '@/api/endpoints/commerce'
import { openRazorpayCheckout } from '@/features/cart/razorpayCheckout'
import { OrderTrackingTimeline } from '@/features/cart/components/OrderTrackingTimeline'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Price } from '@/shared/ui/Price'
import { ProductImage } from '@/shared/ui/ProductImage'
import { PageLoading } from '@/shared/ui/Skeleton'
import { getErrorMessage } from '@/shared/utils/errors'
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey'
import { useAuthStore } from '@/store/authStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Heart,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

const TERMINAL_PAYMENT = new Set(['paid', 'failed', 'refunded', 'partially_refunded', 'cod'])

function isTerminalPayment(status: string | undefined) {
  return !!status && TERMINAL_PAYMENT.has(status)
}

async function collectRazorpayPayment(
  payment: PaymentStart,
  user: { email?: string | null; phone?: string | null } | null,
) {
  assertRazorpayCheckout(payment)
  const checkout = await openRazorpayCheckout({
    keyId: payment.razorpayKeyId!,
    gatewayOrderId: payment.gatewayOrderId,
    email: user?.email,
    contact: user?.phone,
  })
  try {
    await paymentApi.verify(payment.paymentId, {
      razorpayOrderId: checkout.razorpay_order_id,
      razorpayPaymentId: checkout.razorpay_payment_id,
      razorpaySignature: checkout.razorpay_signature,
    })
  } catch {
    // Webhook may still confirm; the order page polls GET /orders/{id}.
  }
}

function TotalsBlock({ totals }: { totals: Totals }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd>
          <Price amountMinor={totals.subtotalMinor} currency={totals.currency} />
        </dd>
      </div>
      <div className="flex justify-between">
        <dt>GST</dt>
        <dd>
          <Price amountMinor={totals.taxMinor} currency={totals.currency} />
        </dd>
      </div>
      <div className="flex justify-between">
        <dt>Shipping</dt>
        <dd>
          {totals.shippingMinor === 0 ? 'Free' : <Price amountMinor={totals.shippingMinor} currency={totals.currency} />}
        </dd>
      </div>
      <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-medium">
        <dt>Total</dt>
        <dd>
          <Price amountMinor={totals.grandTotalMinor} currency={totals.currency} />
        </dd>
      </div>
    </dl>
  )
}

function PriceDetailsBlock({ details }: { details: PriceBreakdown }) {
  return (
    <div>
      <h2 className="font-display text-2xl">Price Details</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-fg-muted)]">MRP (incl. of all taxes)</dt>
          <dd>
            <Price amountMinor={details.mrpMinor} currency={details.currency} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-fg-muted)]">
            Fees ({details.feeLabel || 'Protect Promise Fee'})
          </dt>
          <dd>
            {details.feeMinor === 0 ? (
              <span>₹0.00</span>
            ) : (
              <Price amountMinor={details.feeMinor} currency={details.currency} />
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-fg-muted)]">Discounts</dt>
          <dd className="text-[var(--color-success)]">
            − <Price amountMinor={details.discountMinor} currency={details.currency} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-brand)]">
          <dt>Total Amount</dt>
          <dd>
            <Price amountMinor={details.totalAmountMinor} currency={details.currency} />
          </dd>
        </div>
        {details.totalSavingsMinor > 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-3 py-2 text-[var(--color-success)]">
            Total Savings: <Price amountMinor={details.totalSavingsMinor} currency={details.currency} />
          </p>
        ) : null}
      </dl>
    </div>
  )
}

export function CartPage() {
  const queryClient = useQueryClient()
  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await cartApi.get()).data,
  })
  const update = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateQty(itemId, quantity).then((r) => r.data),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  })
  const remove = useMutation({
    mutationFn: (itemId: number) => cartApi.remove(itemId).then((r) => r.data),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  })

  if (cart.isLoading) {
    return <PageLoading label="Loading bag" />
  }
  if (cart.isError) {
    return (
      <div className="nv-container py-12">
        <ErrorState message={getErrorMessage(cart.error)} onRetry={() => cart.refetch()} />
      </div>
    )
  }
  const data = cart.data as CartView
  if (!data.items.length) {
    return (
      <div className="nv-container py-16">
        <p className="nv-label">Bag</p>
        <h1 className="mt-2 font-display text-4xl text-[var(--color-brand)]">Your bag</h1>
        <EmptyState
          className="mt-10"
          icon={<ShoppingBag />}
          title="Your conscious collection starts here."
          description="Explore thoughtfully made pieces and add what belongs with you."
          action={
            <Link to="/shop">
              <Button>Explore Products</Button>
            </Link>
          }
        />
      </div>
    )
  }
  return (
    <div className="nv-container grid gap-10 py-12 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div>
          <p className="nv-label">Bag</p>
          <h1 className="mt-2 font-display text-4xl text-[var(--color-brand)]">Your bag</h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">Your conscious choices · {data.items.length} item{data.items.length === 1 ? '' : 's'}</p>
        </div>
        {data.items.map((item) => (
          <article
            key={item.itemId}
            className="flex gap-4 border-b border-[var(--color-border)] pb-5 last:border-0"
          >
            <Link to={`/products/${item.productSlug}`} className="shrink-0">
              <ProductImage
                imageUrl={item.imageUrl}
                alt={item.productName}
                className="h-24 w-20 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] object-cover sm:h-28 sm:w-24"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/products/${item.productSlug}`} className="font-display text-2xl text-[var(--color-brand)]">
                {item.productName}
              </Link>
              <p className="text-sm text-[var(--color-fg-muted)]">{item.sku}</p>
              {item.priceChanged ? (
                <p className="text-sm text-[var(--color-accent)]">Price updated since you added this</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="h-10 w-10 text-lg text-[var(--color-brand)] disabled:opacity-40"
                    disabled={item.quantity <= 1 || update.isPending}
                    onClick={() => update.mutate({ itemId: item.itemId, quantity: item.quantity - 1 })}
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="h-10 w-10 text-lg text-[var(--color-brand)] disabled:opacity-40"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ itemId: item.itemId, quantity: item.quantity + 1 })}
                  >
                    +
                  </button>
                </div>
                <Price amountMinor={item.lineTotalMinor} />
              </div>
              <Button size="sm" variant="ghost" className="mt-2 !px-0" onClick={() => remove.mutate(item.itemId)}>
                Remove
              </Button>
            </div>
          </article>
        ))}
        <Link to="/shop" className="inline-block text-sm font-semibold text-[var(--color-forest-800)] underline-offset-4 hover:underline">
          Continue shopping
        </Link>
      </div>
      <aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl text-[var(--color-brand)]">Order summary</h2>
        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">Transparent pricing — GST and shipping from the server.</p>
        <div className="mt-5">
          <TotalsBlock totals={data.totals} />
        </div>
        <Link to="/checkout">
          <Button className="mt-6 w-full" size="lg">
            Proceed to Checkout
          </Button>
        </Link>
      </aside>
    </div>
  )
}

export function WishlistPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const wishlist = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await wishlistApi.get()).data,
  })
  const remove = useMutation({
    mutationFn: (sku: string) => wishlistApi.remove(sku),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      await queryClient.invalidateQueries({ queryKey: ['wishlist-status'] })
    },
  })
  const moveToBag = useMutation({
    mutationFn: async (sku: string) => {
      await cartApi.add(sku, 1)
      await wishlistApi.remove(sku)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      await queryClient.invalidateQueries({ queryKey: ['wishlist-status'] })
      navigate('/cart')
    },
  })

  if (wishlist.isLoading) {
    return <PageLoading label="Loading wishlist" />
  }
  if (wishlist.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={getErrorMessage(wishlist.error)} onRetry={() => wishlist.refetch()} />
      </div>
    )
  }
  const items = wishlist.data?.items ?? []
  if (!items.length) {
    return (
      <div className="nv-container py-16">
        <p className="nv-label">Wishlist</p>
        <h1 className="mt-2 font-display text-4xl text-[var(--color-brand)]">Saved pieces</h1>
        <EmptyState
          className="mt-10"
          icon={<Heart />}
          title="Your collection is waiting."
          description="Save the pieces you love — tap the heart on any product."
          action={
            <Link to="/shop">
              <Button>Explore Products</Button>
            </Link>
          }
        />
      </div>
    )
  }
  return (
    <div className="nv-container py-12">
      <p className="nv-label">Wishlist</p>
      <h1 className="mt-2 font-display text-4xl text-[var(--color-brand)]">Saved pieces</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{items.length} saved piece{items.length === 1 ? '' : 's'}</p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.itemId} className="group">
            <Link to={`/products/${item.productSlug}`}>
              <ProductImage
                imageUrl={item.imageUrl}
                alt={item.productName}
                className="aspect-[4/5] w-full rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)] nv-img-zoom"
              />
              <h2 className="mt-3 font-display text-2xl text-[var(--color-brand)]">{item.productName}</h2>
            </Link>
            <p className="text-sm text-[var(--color-fg-muted)]">{item.sku}</p>
            <p className="mt-1 font-semibold text-[var(--color-forest-800)]">
              <Price amountMinor={item.priceMinor} currency={item.currency} />
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={moveToBag.isPending}
                disabled={item.available < 1}
                onClick={() => moveToBag.mutate(item.sku)}
              >
                {item.available < 1 ? 'Out of stock' : 'Add to Cart'}
              </Button>
              <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(item.sku)}>
                Remove
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const sourceParam = (params.get('source') ?? '').toLowerCase()
  const source = sourceParam === 'buy_now' || sourceParam === 'buy-now' ? 'BUY_NOW' : 'CART'
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const orderKey = useIdempotencyKey()
  const payKey = useIdempotencyKey()
  const [addressId, setAddressId] = useState<number>()
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'PREPAID' | 'COD'>('PREPAID')
  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await addressApi.list()).data,
    enabled: !!accessToken,
  })
  const preview = useQuery({
    queryKey: ['checkout', source, addressId ?? 'none'],
    queryFn: async () => (await checkoutApi.preview(addressId, source)).data,
    enabled: !!accessToken,
    retry: false,
  })

  const place = useMutation({
    mutationFn: async () => {
      if (!addressId) throw new Error('Select an address')
      const order = (await checkoutApi.place(addressId, orderKey.getKey(), source, paymentMethod)).data
      if (order.paymentStatus === 'cod') {
        orderKey.reset()
        payKey.reset()
        return order
      }
      const payment = (await paymentApi.start(order.orderId, payKey.getKey())).data
      try {
        await collectRazorpayPayment(payment, user)
      } catch (err) {
        if (err instanceof Error && err.message === 'Payment cancelled') {
          try {
            await paymentApi.cancel(payment.paymentId)
          } catch {
            // webhook may still settle this payment
          }
        }
        throw err
      }
      orderKey.reset()
      payKey.reset()
      return order
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['checkout'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', order.orderId] })
      navigate(`/orders/${order.orderId}`, { replace: true })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const items = preview.data?.cart.items ?? []
  const priceDetails = preview.data?.priceDetails
  const step = !addressId ? 1 : paymentMethod ? 3 : 2

  return (
    <div className="nv-container max-w-4xl py-12">
      <p className="nv-label">Checkout</p>
      <h1 className="mt-2 font-display text-4xl text-[var(--color-brand)]">Secure checkout</h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-fg-muted)]">
        {source === 'BUY_NOW'
          ? 'Buy Now — only the selected product is checked out. Your bag stays unchanged.'
          : 'A calm, distraction-free checkout. Every charge is confirmed by the backend.'}
      </p>

      <ol className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Checkout progress">
        {[
          { n: 1, label: 'Address' },
          { n: 2, label: 'Delivery' },
          { n: 3, label: 'Payment' },
          { n: 4, label: 'Confirmation' },
        ].map((s) => (
          <li
            key={s.n}
            className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-center text-sm ${
              step >= s.n
                ? 'border-[var(--color-forest-800)] bg-[var(--color-action-soft)] text-[var(--color-forest-800)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)]'
            }`}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-70">Step {s.n}</span>
            {s.label}
          </li>
        ))}
      </ol>

      {error ? <p className="mt-4 text-[var(--color-danger)]">{error}</p> : null}
      {preview.isError ? (
        <div className="mt-6">
          <ErrorState
            message={getErrorMessage(preview.error)}
            onRetry={() => preview.refetch()}
          />
          {source === 'BUY_NOW' ? (
            <Link to="/shop" className="mt-4 inline-block underline">
              Return to shop
            </Link>
          ) : null}
        </div>
      ) : null}

      {preview.isLoading ? <PageLoading label="Preparing checkout" /> : null}

      {!preview.isError && items.length > 0 ? (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <h2 className="font-display text-2xl">Order items</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={`${item.sku}-${item.itemId}`} className="flex items-center gap-3">
                <ProductImage
                  imageUrl={item.imageUrl}
                  alt={item.productName}
                  className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] sm:h-16 sm:w-16"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-brand)]">{item.productName}</p>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Qty {item.quantity}
                    {item.sku ? ` · ${item.sku}` : ''}
                  </p>
                </div>
                <Price amountMinor={item.lineTotalMinor} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!preview.isError && !preview.isLoading && items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag />}
          title={source === 'BUY_NOW' ? 'Buy Now session expired' : 'Nothing to checkout'}
          description={
            source === 'BUY_NOW'
              ? 'Return to the product and tap Buy Now again.'
              : 'Add items to your bag before checkout.'
          }
          action={
            <Link to={source === 'BUY_NOW' ? '/shop' : '/cart'}>
              <Button>{source === 'BUY_NOW' ? 'Browse shop' : 'Open bag'}</Button>
            </Link>
          }
        />
      ) : null}

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-2xl text-[var(--color-brand)]">Ship to</h2>
        {addresses.data?.map((address) => (
          <label
            key={address.id}
            className={`flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 transition ${
              addressId === address.id
                ? 'border-[var(--color-forest-800)] bg-[var(--color-action-soft)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-forest-800)]/35'
            }`}
          >
            <input
              type="radio"
              name="address"
              className="mt-1"
              checked={addressId === address.id}
              onChange={() => setAddressId(address.id)}
            />
            <span>
              <span className="font-medium text-[var(--color-brand)]">{address.contactName}</span>
              <span className="mt-1 block text-sm text-[var(--color-fg-muted)]">
                {address.line1}, {address.city}, {address.state} {address.pincode}
              </span>
            </span>
          </label>
        ))}
        {!addresses.data?.length ? (
          <Link to="/account" className="inline-block text-sm font-semibold text-[var(--color-forest-800)] underline-offset-4 hover:underline">
            Add an address in your account
          </Link>
        ) : null}
      </section>

      {priceDetails ? (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
          <PriceDetailsBlock details={priceDetails} />
        </section>
      ) : null}

      {preview.data?.codAvailable ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-2xl text-[var(--color-brand)]">Payment</h2>
          <label
            className={`flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 ${
              paymentMethod === 'PREPAID'
                ? 'border-[var(--color-forest-800)] bg-[var(--color-action-soft)]'
                : 'border-[var(--color-border)]'
            }`}
          >
            <input
              type="radio"
              name="pay"
              className="mt-1"
              checked={paymentMethod === 'PREPAID'}
              onChange={() => setPaymentMethod('PREPAID')}
            />
            <span>
              <span className="font-medium">Prepaid</span>
              <span className="mt-0.5 block text-sm text-[var(--color-fg-muted)]">Pay securely with Razorpay</span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 ${
              paymentMethod === 'COD'
                ? 'border-[var(--color-forest-800)] bg-[var(--color-action-soft)]'
                : 'border-[var(--color-border)]'
            }`}
          >
            <input
              type="radio"
              name="pay"
              className="mt-1"
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
            />
            <span>
              <span className="font-medium">Cash on delivery</span>
              <span className="mt-0.5 block text-sm text-[var(--color-fg-muted)]">
                Pay when the package arrives — only shown when enabled for your order.
              </span>
            </span>
          </label>
        </section>
      ) : (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/50 p-4 text-sm text-[var(--color-fg-muted)]">
          Prepaid payment via Razorpay. COD is not available for this order.
        </section>
      )}

      <Button
        className="mt-8 w-full sm:w-auto"
        size="lg"
        disabled={!addressId || items.length === 0 || preview.isError}
        loading={place.isPending}
        onClick={() => place.mutate()}
      >
        <CreditCard size={16} />{' '}
        {place.isPending
          ? paymentMethod === 'COD'
            ? 'Placing order…'
            : 'Opening payment…'
          : paymentMethod === 'COD'
            ? 'Place Order'
            : 'Continue to Payment'}
      </Button>
    </div>
  )
}

export function OrdersPage() {
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await checkoutApi.orders()).data,
  })
  if (orders.isLoading) return <PageLoading label="Loading orders" />
  if (orders.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={getErrorMessage(orders.error)} onRetry={() => orders.refetch()} />
      </div>
    )
  }
  if (!orders.data?.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-4xl text-[var(--color-brand)]">Orders</h1>
        <EmptyState
          className="mt-8"
          icon={<Package />}
          title="No orders yet"
          description="When you complete checkout, they will appear here."
          action={
            <Link to="/shop">
              <Button>Continue shopping</Button>
            </Link>
          }
        />
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Account</p>
          <h1 className="font-display text-4xl text-[var(--color-brand)]">Orders</h1>
        </div>
        <Link to="/shop" className="text-sm underline">
          Continue shopping
        </Link>
      </div>
      {orders.data.map((order) => (
        <Link
          key={order.orderId}
          to={`/orders/${order.orderId}`}
          className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 transition hover:border-[var(--color-brand)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{order.orderNumber}</p>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                {order.placedAt ? new Date(order.placedAt).toLocaleString() : 'Placed recently'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm capitalize text-[var(--color-fg-muted)]">
                {order.orderStatus} · {order.paymentStatus}
              </p>
              <p className="mt-1 font-medium">
                <Price amountMinor={order.totals.grandTotalMinor} currency={order.totals.currency} />
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            {order.items.length} item{order.items.length === 1 ? '' : 's'}
            {order.items[0] ? ` · ${order.items[0].productName}` : ''}
            {order.items.length > 1 ? ' and more' : ''}
          </p>
        </Link>
      ))}
    </div>
  )
}

function OrderSuccessHero({ order }: { order: OrderView }) {
  const paid = order.paymentStatus === 'paid' || order.paymentStatus === 'cod'
  const failed = order.paymentStatus === 'failed'
  const confirming = !paid && !failed && !['refunded', 'partially_refunded'].includes(order.paymentStatus)

  return (
    <section
      className={`rounded-[1.5rem] px-6 py-8 sm:px-8 ${
        paid
          ? 'bg-[linear-gradient(135deg,#1f3d2b_0%,#2f5a40_55%,#4f7a57_100%)] text-[var(--color-cream-50)]'
          : failed
            ? 'bg-[var(--color-bg-muted)]'
            : 'bg-[var(--color-bg-muted)]'
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            paid ? 'bg-white/15' : failed ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-white'
          }`}
        >
          {paid ? <CheckCircle2 size={28} /> : failed ? <CreditCard size={28} /> : <Package size={28} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs uppercase tracking-[0.2em] ${paid ? 'text-white/70' : 'text-[var(--color-accent)]'}`}>
            {paid ? (order.paymentStatus === 'cod' ? 'COD order placed' : 'Order confirmed') : failed ? 'Payment unsuccessful' : 'Confirming payment'}
          </p>
          <h1 className={`mt-2 font-display text-4xl sm:text-5xl ${paid ? '' : 'text-[var(--color-brand)]'}`}>
            {paid ? 'Your order is confirmed.' : failed ? 'Payment could not be completed.' : 'Confirming your payment'}
          </h1>
          <p className={`mt-3 max-w-xl text-sm sm:text-base ${paid ? 'text-white/80' : 'text-[var(--color-fg-muted)]'}`}>
            {paid
              ? order.paymentStatus === 'cod'
                ? 'Your COD order is placed. Track progress below and pay when the package arrives.'
                : 'Payment received. Your makers have been notified — track every step below.'
              : failed
                ? 'Your order is still saved. Retry payment without losing your items or address.'
                : 'Waiting for the bank to confirm your Razorpay payment. This page updates automatically.'}
          </p>
        </div>
      </div>
      <div className={`mt-8 grid gap-3 sm:grid-cols-3 ${paid ? 'text-white' : ''}`}>
        <div className={`rounded-xl p-4 ${paid ? 'bg-white/10' : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]'}`}>
          <p className={`text-xs uppercase tracking-wide ${paid ? 'text-white/70' : 'text-[var(--color-fg-muted)]'}`}>
            Order number
          </p>
          <p className="mt-1 font-medium">{order.orderNumber}</p>
        </div>
        <div className={`rounded-xl p-4 ${paid ? 'bg-white/10' : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]'}`}>
          <p className={`text-xs uppercase tracking-wide ${paid ? 'text-white/70' : 'text-[var(--color-fg-muted)]'}`}>
            Payment
          </p>
          <p className="mt-1 font-medium capitalize">
            {order.paymentStatus === 'cod' ? 'COD' : order.paymentStatus === 'paid' ? 'Prepaid · Paid' : order.paymentStatus}
          </p>
        </div>
        <div className={`rounded-xl p-4 ${paid ? 'bg-white/10' : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]'}`}>
          <p className={`text-xs uppercase tracking-wide ${paid ? 'text-white/70' : 'text-[var(--color-fg-muted)]'}`}>
            Total {order.paymentStatus === 'cod' ? 'payable' : 'paid'}
          </p>
          <p className="mt-1 font-medium">
            <Price amountMinor={order.totals.grandTotalMinor} currency={order.totals.currency} />
          </p>
        </div>
      </div>
      {confirming ? <p className="mt-4 text-sm opacity-80">Refreshing status…</p> : null}
    </section>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const payKey = useIdempotencyKey()
  const [retryError, setRetryError] = useState<string | null>(null)
  const startedAt = useRef(Date.now())
  const order = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await checkoutApi.order(id!)).data,
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus
      if (isTerminalPayment(status)) return false
      const elapsed = Date.now() - startedAt.current
      if (elapsed < 120_000) return 2000
      if (elapsed < 300_000) return 10_000
      return false
    },
  })
  const tracking = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: async () => (await checkoutApi.tracking(id!)).data,
    enabled: !!id,
    refetchInterval: (query) => {
      const shipments = query.state.data?.shipments ?? []
      if (shipments.some((s) => s.status === 'delivered')) return false
      return 4000
    },
  })

  const retryPay = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Missing order')
      const payment = (await paymentApi.start(id, payKey.getKey())).data
      await collectRazorpayPayment(payment, user)
      payKey.reset()
      startedAt.current = Date.now()
      await queryClient.invalidateQueries({ queryKey: ['order', id] })
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err) => setRetryError(getErrorMessage(err)),
  })

  if (order.isLoading) return <PageLoading label="Loading order" />
  if (order.isError || !order.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={getErrorMessage(order.error)} onRetry={() => order.refetch()} />
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} /> Back to orders
        </Button>
      </div>
    )
  }
  const data = order.data
  const failed = data.paymentStatus === 'failed'
  const address = data.shippingAddress ?? {}

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link to="/orders" className="text-sm underline">
          Order history
        </Link>
      </div>

      <OrderSuccessHero order={data} />

      <div className="flex flex-wrap gap-3">
        <Link to={`/orders/${data.orderId}`}>
          <Button>
            <Package size={16} /> View order status
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="secondary">Continue shopping</Button>
        </Link>
        {failed ? (
          <Button loading={retryPay.isPending} onClick={() => retryPay.mutate()}>
            <CreditCard size={16} /> Retry payment
          </Button>
        ) : null}
      </div>
      {retryError ? <p className="text-sm text-[var(--color-danger)]">{retryError}</p> : null}
      {!isTerminalPayment(data.paymentStatus) && Date.now() - startedAt.current > 120_000 ? (
        <p className="text-sm text-[var(--color-fg-muted)]">
          This is taking longer than usual. Keep this page open or refresh — we will update as soon as the bank
          confirms.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-4 lg:col-span-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
            <h2 className="font-display text-2xl text-[var(--color-brand)]">Items</h2>
            <ul className="mt-4 divide-y divide-[var(--color-border)]">
              {data.items.map((item) => (
                <li key={item.sku} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      {item.sku} · Qty {item.quantity}
                    </p>
                    {item.taxMinor > 0 ? (
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        Incl. GST <Price amountMinor={item.taxMinor} currency={data.totals.currency} />
                      </p>
                    ) : null}
                  </div>
                  <Price amountMinor={item.lineTotalMinor} currency={data.totals.currency} />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
            <h2 className="flex items-center gap-2 font-display text-2xl text-[var(--color-brand)]">
              <Truck size={20} /> Shipping address
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {[address.contactName, address.line1, address.line2, address.city, address.state, address.pincode]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p className="mt-2 text-sm capitalize text-[var(--color-fg-muted)]">
              Order status: {data.orderStatus.replaceAll('_', ' ')}
            </p>
          </div>

          <OrderTrackingTimeline
            tracking={tracking.data}
            orderStatus={data.orderStatus}
            paymentStatus={data.paymentStatus}
          />
        </section>

        <aside className="space-y-4 lg:col-span-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
            <h2 className="font-display text-2xl text-[var(--color-brand)]">Summary</h2>
            <div className="mt-4">
              <TotalsBlock totals={data.totals} />
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 text-sm">
            <h2 className="font-display text-2xl text-[var(--color-brand)]">Details</h2>
            <dl className="mt-4 space-y-2 text-[var(--color-fg-muted)]">
              <div className="flex justify-between gap-3">
                <dt>Placed</dt>
                <dd className="text-right text-[var(--color-fg)]">
                  {data.placedAt ? new Date(data.placedAt).toLocaleString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Order ID</dt>
                <dd className="break-all text-right font-mono text-xs text-[var(--color-fg)]">{data.orderId}</dd>
              </div>
              {data.paymentId ? (
                <div className="flex justify-between gap-3">
                  <dt>Payment ID</dt>
                  <dd className="break-all text-right font-mono text-xs text-[var(--color-fg)]">{data.paymentId}</dd>
                </div>
              ) : null}
              {data.gatewayPaymentId ? (
                <div className="flex justify-between gap-3">
                  <dt>Razorpay</dt>
                  <dd className="break-all text-right font-mono text-xs text-[var(--color-fg)]">
                    {data.gatewayPaymentId}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt>GST</dt>
                <dd>
                  <Price amountMinor={data.totals.taxMinor} currency={data.totals.currency} />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Shipping</dt>
                <dd>
                  {data.totals.shippingMinor === 0 ? (
                    'Free'
                  ) : (
                    <Price amountMinor={data.totals.shippingMinor} currency={data.totals.currency} />
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
