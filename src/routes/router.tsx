import { HomePage } from '@/features/home/pages/HomePage'
import { ShopLayout } from '@/layouts/ShopLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RouteFallback } from '@/shared/ui/RouteFallback'
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ShopLayout />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'shop',
        lazy: async () => {
          const { ShopPage } = await import('@/features/product/pages/CatalogPages')
          return { Component: ShopPage }
        },
      },
      {
        path: 'category/:slug',
        lazy: async () => {
          const { CategoryPage } = await import('@/features/product/pages/CatalogPages')
          return { Component: CategoryPage }
        },
      },
      {
        path: 'products/:slugOrId',
        lazy: async () => {
          const { ProductDetailPage } = await import('@/features/product/pages/ProductDetailPage')
          return { Component: ProductDetailPage }
        },
      },
      {
        path: 'search',
        lazy: async () => {
          const { SearchPage } = await import('@/features/product/pages/CatalogPages')
          return { Component: SearchPage }
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { AuthPage } = await import('@/features/auth/pages/AuthPage')
          function LoginRoute() {
            return <AuthPage initialMode="password" />
          }
          return { Component: LoginRoute }
        },
      },
      {
        path: 'register',
        lazy: async () => {
          const { AuthPage } = await import('@/features/auth/pages/AuthPage')
          function RegisterRoute() {
            return <AuthPage initialMode="register" />
          }
          return { Component: RegisterRoute }
        },
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'account',
            lazy: async () => {
              const { AccountPage } = await import('@/features/profile/pages/AccountPage')
              return { Component: AccountPage }
            },
          },
          {
            path: 'admin/products',
            lazy: async () => {
              const { AdminProductImagesPage } = await import(
                '@/features/product/pages/AdminProductImagesPage'
              )
              return { Component: AdminProductImagesPage }
            },
          },
          {
            path: 'wishlist',
            lazy: async () => {
              const { WishlistPage } = await import('@/features/cart/pages/CommercePages')
              return { Component: WishlistPage }
            },
          },
          {
            path: 'cart',
            lazy: async () => {
              const { CartPage } = await import('@/features/cart/pages/CommercePages')
              return { Component: CartPage }
            },
          },
          {
            path: 'checkout',
            lazy: async () => {
              const { CheckoutPage } = await import('@/features/cart/pages/CommercePages')
              return { Component: CheckoutPage }
            },
          },
          {
            path: 'orders',
            lazy: async () => {
              const { OrdersPage } = await import('@/features/cart/pages/CommercePages')
              return { Component: OrdersPage }
            },
          },
          {
            path: 'orders/:id',
            lazy: async () => {
              const { OrderDetailPage } = await import('@/features/cart/pages/CommercePages')
              return { Component: OrderDetailPage }
            },
          },
        ],
      },
    ],
  },
])
