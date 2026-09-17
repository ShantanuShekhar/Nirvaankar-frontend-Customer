import { apiClient } from '@/api/client'

export type StoreConfigView = {
  codEnabled: boolean
  returnEnabled: boolean
  returnWindowDays: number
}

export const configApi = {
  store() {
    return apiClient.get<StoreConfigView>('/api/v1/config/store')
  },
}
