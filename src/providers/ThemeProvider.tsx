import { FALLBACK_THEME_TOKENS, QUERY_DEFAULTS } from '@/config/defaults'
import { BACKEND_CAPABILITIES } from '@/api/endpoints/capabilities'
import { flattenThemeTokens } from '@/shared/utils/helpers'
import { useQuery } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

type ThemeLayers = {
  global: Record<string, string>
  semantic: Record<string, string>
  component: Record<string, string>
}

async function fetchThemeTokens(): Promise<ThemeLayers | null> {
  if (!BACKEND_CAPABILITIES.themeConfig) {
    return null
  }
  // Reserved path `/api/v1/config/**` — no controller yet.
  return null
}

function applyTokens(tokens: ThemeLayers) {
  const flat = flattenThemeTokens(tokens)
  const root = document.documentElement
  for (const [cssVar, value] of Object.entries(flat)) {
    root.style.setProperty(cssVar, value)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ['theme-tokens'],
    queryFn: fetchThemeTokens,
    staleTime: QUERY_DEFAULTS.themeStaleTime,
    retry: false,
  })

  useEffect(() => {
    applyTokens(data ?? FALLBACK_THEME_TOKENS)
  }, [data])

  return children
}
