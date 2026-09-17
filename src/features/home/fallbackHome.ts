import type { SduiSection } from '@/features/sdui/types'

/** Local fallback composition used while `/api/v1/config` SDUI is unimplemented. */
export const FALLBACK_HOME_SECTIONS: SduiSection[] = [
  {
    id: 'why',
    componentType: 'usp_row',
    props: {
      title: 'Why Nirvaankar',
      items: [
        { title: 'Verified craft', text: 'Handmade and natural categories only.' },
        { title: 'Transparent values', text: 'Eco-friendly and ethical by design.' },
        { title: 'Calm shopping', text: 'Premium experience without marketplace noise.' },
      ],
    },
  },
  {
    id: 'collections',
    componentType: 'banner',
    props: {
      title: 'Handmade collections',
      subtitle:
        'Terracotta, handloom and natural goods from the live catalog — filter by category in the shop.',
      ctaLabel: 'Browse the shop',
      ctaHref: '/shop',
    },
  },
  {
    id: 'category',
    componentType: 'category_strip',
    props: {
      title: 'Shop by intention',
      categories: [
        { name: 'Handmade', slug: 'handmade' },
        { name: 'Natural', slug: 'natural' },
        { name: 'Eco-friendly', slug: 'eco-friendly' },
        { name: 'Plant-based', slug: 'plant-based' },
      ],
    },
  },
]
