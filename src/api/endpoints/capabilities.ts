export const CATALOG_BASE = '/api/v1/catalog'
export const CONFIG_BASE = '/api/v1/config'
export const ORDERS_BASE = '/api/v1/orders'
export const PAYMENTS_BASE = '/api/v1/payments'
export const REFUNDS_BASE = '/api/v1/refunds'

export const BACKEND_CAPABILITIES = {
  identity: true,
  addresses: true,
  catalog: true,
  cart: true,
  wishlist: true,
  orders: true,
  payments: true,
  sdui: false,
  themeConfig: false,
  seller: false,
} as const
