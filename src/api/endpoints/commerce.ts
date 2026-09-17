import { apiClient } from '@/api/client'
import type { CursorPage } from '@/api/types'

export type Totals = {
  subtotalMinor: number
  discountMinor: number
  taxMinor: number
  shippingMinor: number
  grandTotalMinor: number
  currency: string
}

export type PriceBreakdown = {
  mrpMinor: number
  discountMinor: number
  feeMinor: number
  totalAmountMinor: number
  totalSavingsMinor: number
  feeLabel: string
  currency: string
}

export type TaxLine = {
  taxType: string
  rate: number
  taxableAmountMinor: number
  taxAmountMinor: number
  hsnCode: string
}

export type ProductImageView = {
  imageId: number
  imageKey: string
  imageUrl: string
  primary: boolean
  sortOrder: number
  altText: string | null
  variantId?: number | null
}

export type ProductCard = {
  productId: string
  slug: string
  name: string
  shortDesc: string | null
  badges: string[]
  categorySlug: string
  categoryName: string
  rootCategoryName?: string | null
  subcategoryName?: string | null
  subcategorySlug?: string | null
  storeName: string
  variantSku: string
  priceMinor: number
  compareAtMinor: number | null
  currency: string
  available: number
  imageKey: string | null
  imageUrl: string | null
}

export type Variant = {
  variantId?: number | null
  sku: string
  attributesJson: string | null
  color?: string | null
  colorHex?: string | null
  label?: string | null
  active: boolean
  priceMinor: number
  compareAtMinor: number | null
  currency: string
  available: number
  images?: ProductImageView[]
}

export type ProductRatingSummary = {
  avgRating: number
  totalReviews: number
  count1: number
  count2: number
  count3: number
  count4: number
  count5: number
}

export type ProductReview = {
  reviewId: number
  rating: number
  title: string | null
  comment: string | null
  reviewerName: string
  createdAt: string
}

export type ProductDetail = {
  productId: string
  slug: string
  name: string
  shortDesc: string | null
  longDesc: string | null
  makerStory: string | null
  material: string | null
  careInstructions: string | null
  returnable: boolean
  badges: string[]
  categorySlug: string
  categoryName: string
  storeName: string
  gstRate: number
  hsnCode: string
  variants: Variant[]
  imageKey: string | null
  imageUrl: string | null
  images: ProductImageView[]
  /** Optional: badges mirrored as highlights for PDP compatibility */
  highlights?: string[]
  offers?: string[]
  specifications?: Array<{ name: string; value: string; displayOrder: number }>
  ratingSummary?: ProductRatingSummary
  reviews?: ProductReview[]
  similarProducts?: ProductCard[]
}

export type Category = {
  slug: string
  name: string
  parentId: number | null
  sortOrder: number
}

export type CategoryNode = {
  id: number
  slug: string
  name: string
  parentId: number | null
  level: number
  sortOrder: number
  children: CategoryNode[]
}

export type ShoppingIntention = {
  code: string
  name: string
  slug: string
  imageKey: string | null
  imageUrl: string | null
  displayOrder: number
}

export type CartItemView = {
  itemId: number
  sku: string
  productId: string
  productSlug: string
  productName: string
  imageUrl?: string | null
  quantity: number
  unitPriceMinor: number
  compareAtMinor?: number | null
  snapshotPriceMinor: number
  priceChanged: boolean
  available: number
  availableToBuy: boolean
  lineSubtotalMinor: number
  lineTaxMinor: number
  lineTotalMinor: number
  taxLines: TaxLine[]
}

export type CartView = {
  cartId: string
  items: CartItemView[]
  totals: Totals
  buyerStateUsed: string | null
}

export type OrderView = {
  orderId: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  totals: Totals
  priceDetails?: PriceBreakdown | null
  shippingAddress: Record<string, string | null>
  items: Array<{
    sku: string
    productName: string
    quantity: number
    unitPriceMinor: number
    taxMinor: number
    lineTotalMinor: number
    taxLines?: TaxLine[]
  }>
  placedAt: string | null
  paymentId: string | null
  gatewayPaymentId: string | null
  gatewayOrderId: string | null
}

export type ShipmentTrackingView = {
  shipmentId: number
  courierName: string | null
  trackingNumber: string | null
  awbNumber: string | null
  consignmentNumber: string | null
  docketNumber: string | null
  trackingUrl: string | null
  status: string
  shippedAt: string | null
  deliveredAt: string | null
}

export type OrderTrackingView = {
  orderId: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  shipments: ShipmentTrackingView[]
}

export type CheckoutPreview = {
  source: 'CART' | 'BUY_NOW' | string
  sessionId: string
  cart: CartView
  priceDetails: PriceBreakdown
  addressId: number | null
  codAvailable?: boolean
}

export type PaymentStart = {
  paymentId: string
  orderId: string
  gateway: string
  amountMinor: number
  currency: string
  gatewayOrderId: string
  simulateCapturePath?: string | null
  razorpayKeyId?: string | null
}

export const catalogApi = {
  categories() {
    return apiClient.get<Category[]>('/api/v1/catalog/categories')
  },
  categoryTree() {
    return apiClient.get<CategoryNode[]>('/api/v1/catalog/categories/tree')
  },
  shoppingIntentions() {
    return apiClient.get<ShoppingIntention[]>('/api/v1/shopping-intentions')
  },
  intentionProducts(slug: string, params?: { cursor?: string; limit?: number }) {
    return apiClient.get<CursorPage<ProductCard>>(`/api/v1/shopping-intentions/${encodeURIComponent(slug)}/products`, {
      params,
    })
  },
  products(params: { category?: string; q?: string; cursor?: string; limit?: number }) {
    return apiClient.get<CursorPage<ProductCard>>('/api/v1/catalog/products', { params })
  },
  product(idOrSlug: string) {
    return apiClient.get<ProductDetail>(`/api/v1/catalog/products/${idOrSlug}`)
  },
  variantImages(idOrSlug: string, variantId: number) {
    return apiClient.get<ProductImageView[]>(
      `/api/v1/catalog/products/${idOrSlug}/variants/${variantId}/images`,
    )
  },
}

export type AdminProductRow = {
  productId: string
  slug: string
  name: string
  status: string
  imageKey: string | null
  imageUrl: string | null
  images: ProductImageView[]
}

export type ProductImageUpload = {
  imageId: number
  imageKey: string
  imageUrl: string
  primary: boolean
  sortOrder: number
}

export const adminCatalogApi = {
  products() {
    return apiClient.get<AdminProductRow[]>('/api/v1/admin/products')
  },
  uploadImage(idOrSlug: string, file: File, primary = false) {
    const body = new FormData()
    body.append('file', file)
    return apiClient.post<ProductImageUpload>(`/api/v1/admin/products/${idOrSlug}/images`, body, {
      params: { primary },
    })
  },
  setPrimary(idOrSlug: string, imageId: number) {
    return apiClient.put<ProductImageUpload>(`/api/v1/admin/products/${idOrSlug}/images/${imageId}/primary`)
  },
  deleteImage(idOrSlug: string, imageId: number) {
    return apiClient.delete<void>(`/api/v1/admin/products/${idOrSlug}/images/${imageId}`)
  },
}

export const cartApi = {
  get(addressId?: number) {
    return apiClient.get<CartView>('/api/v1/cart', { params: { addressId } })
  },
  add(sku: string, quantity: number, addressId?: number) {
    return apiClient.post<CartView>('/api/v1/cart/items', { sku, quantity }, { params: { addressId } })
  },
  updateQty(itemId: number, quantity: number, addressId?: number) {
    return apiClient.patch<CartView>(`/api/v1/cart/items/${itemId}`, { quantity }, { params: { addressId } })
  },
  remove(itemId: number, addressId?: number) {
    return apiClient.delete<CartView>(`/api/v1/cart/items/${itemId}`, { params: { addressId } })
  },
}

export const checkoutApi = {
  startBuyNow(sku: string, quantity: number) {
    return apiClient.post<CheckoutPreview>('/api/v1/checkout/buy-now', { sku, quantity })
  },
  preview(addressId?: number | null, source: 'CART' | 'BUY_NOW' = 'CART') {
    return apiClient.get<CheckoutPreview>('/api/v1/checkout/preview', {
      params: {
        source,
        ...(addressId != null ? { addressId } : {}),
      },
    })
  },
  place(addressId: number, idempotencyKey: string, source: 'CART' | 'BUY_NOW' = 'CART', paymentMethod: 'PREPAID' | 'COD' = 'PREPAID') {
    return apiClient.post<OrderView>(
      '/api/v1/orders',
      { addressId, source, paymentMethod },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  },
  orders() {
    return apiClient.get<OrderView[]>('/api/v1/orders')
  },
  order(orderId: string) {
    return apiClient.get<OrderView>(`/api/v1/orders/${orderId}`)
  },
  tracking(orderId: string) {
    return apiClient.get<OrderTrackingView>(`/api/v1/orders/${orderId}/tracking`)
  },
}

export type WishlistItem = {
  itemId: number
  sku: string
  productId: string
  productSlug: string
  productName: string
  imageUrl: string | null
  priceMinor: number
  currency: string
  available: number
  addedAt: string
}

export type WishlistView = {
  wishlistId: number
  name: string
  items: WishlistItem[]
}

export const wishlistApi = {
  get() {
    return apiClient.get<WishlistView>('/api/v1/wishlist')
  },
  status(sku: string) {
    return apiClient.get<{ wishlisted: boolean; sku: string }>('/api/v1/wishlist/status', {
      params: { sku },
    })
  },
  add(sku: string) {
    return apiClient.post<WishlistView>('/api/v1/wishlist/items', { sku })
  },
  remove(sku: string) {
    return apiClient.delete<WishlistView>('/api/v1/wishlist/items', { params: { sku } })
  },
}

export function assertRazorpayCheckout(payment: PaymentStart) {
  if (payment.gateway !== 'razorpay' || !payment.razorpayKeyId) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the API.')
  }
  if (!payment.gatewayOrderId?.startsWith('order_')) {
    throw new Error('Checkout did not receive a Razorpay order_id. Restart the API with Razorpay Test Mode keys.')
  }
}

export const paymentApi = {
  start(orderId: string, idempotencyKey: string) {
    return apiClient.post<PaymentStart>(
      '/api/v1/payments',
      { orderId },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  },
  verify(paymentId: string, body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return apiClient.post<OrderView>(`/api/v1/payments/${paymentId}/verify`, body)
  },
  cancel(paymentId: string) {
    return apiClient.post(`/api/v1/payments/${paymentId}/cancel`)
  },
}
