import { apiClient } from '@/api/client'

export type StoreConfigView = {
  codEnabled: boolean
  returnEnabled: boolean
  returnWindowDays: number
  /** Relative API path to stream homepage hero media from S3, or null when unset. */
  heroImageUrl: string | null
}

export const configApi = {
  store() {
    return apiClient.get<StoreConfigView>('/api/v1/config/store')
  },
}
