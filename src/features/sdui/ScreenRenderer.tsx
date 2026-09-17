import { SUPPORTED_SDUI_SCHEMA_VERSION } from '@/config/defaults'
import { BACKEND_CAPABILITIES } from '@/api/endpoints/capabilities'
import { sduiRegistry } from '@/features/sdui/registry'
import { SduiBlockErrorBoundary } from '@/features/sdui/SduiBlockErrorBoundary'
import type { SduiSection } from '@/features/sdui/types'
import { SectionSkeleton } from '@/shared/ui/Skeleton'
import { Suspense } from 'react'

type Props = {
  screenKey: string
  fallbackSections?: SduiSection[]
}

async function loadScreen(_screenKey: string): Promise<SduiSection[] | null> {
  if (!BACKEND_CAPABILITIES.sdui) return null
  return null
}

export function ScreenRenderer({ screenKey, fallbackSections = [] }: Props) {
  // Synchronous fallback path — React Query can replace this when config API exists.
  void loadScreen(screenKey)
  const sections = fallbackSections.filter((section) => {
    const version = section.schemaVersion ?? SUPPORTED_SDUI_SCHEMA_VERSION
    return version <= SUPPORTED_SDUI_SCHEMA_VERSION
  })

  return (
    <div>
      {sections.map((section) => {
        const Block = sduiRegistry[section.componentType]
        if (!Block) {
          // Unknown component types are skipped — never crash the page.
          return null
        }
        return (
          <SduiBlockErrorBoundary key={section.id} name={section.componentType}>
            <Suspense fallback={<SectionSkeleton />}>
              <Block props={section.props} />
            </Suspense>
          </SduiBlockErrorBoundary>
        )
      })}
    </div>
  )
}
