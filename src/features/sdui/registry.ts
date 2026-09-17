import type { ComponentType } from 'react'
import { lazy } from 'react'

export type SduiBlockProps = { props?: Record<string, unknown> }

export const sduiRegistry: Record<string, ComponentType<SduiBlockProps>> = {
  banner: lazy(() =>
    import('@/features/sdui/blocks/BannerBlock').then((m) => ({ default: m.BannerBlock })),
  ),
  category_strip: lazy(() =>
    import('@/features/sdui/blocks/CategoryStripBlock').then((m) => ({
      default: m.CategoryStripBlock,
    })),
  ),
  usp_row: lazy(() =>
    import('@/features/sdui/blocks/UspRowBlock').then((m) => ({ default: m.UspRowBlock })),
  ),
  product_grid: lazy(() =>
    import('@/features/sdui/blocks/ProductGridBlock').then((m) => ({
      default: m.ProductGridBlock,
    })),
  ),
  hero_carousel: lazy(() =>
    import('@/features/sdui/blocks/BannerBlock').then((m) => ({ default: m.BannerBlock })),
  ),
}
