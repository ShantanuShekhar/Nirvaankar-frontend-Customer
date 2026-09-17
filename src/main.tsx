import { AppProviders } from '@/providers/AppProviders'
import { AuthBootstrapProvider } from '@/providers/AuthBootstrapProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { router } from '@/routes/router'
import { RouteFallback } from '@/shared/ui/RouteFallback'
import '@/styles/index.css'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <ThemeProvider>
        <AuthBootstrapProvider>
          <Suspense fallback={<RouteFallback />}>
            <RouterProvider router={router} />
          </Suspense>
        </AuthBootstrapProvider>
      </ThemeProvider>
    </AppProviders>
  </StrictMode>,
)
