import { API_BASE_URL } from '@/config/defaults'
import type { ApiErrorBody, ApiErrorResponse } from '@/api/types'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly traceId?: string | null
  readonly fieldErrors: NonNullable<ApiErrorBody['fieldErrors']>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.traceId = body.traceId
    this.fieldErrors = body.fieldErrors ?? []
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function parseApiError(error: AxiosError<ApiErrorResponse>): ApiError {
  const status = error.response?.status ?? 0
  const body = error.response?.data?.error
  if (body?.code && body.message) {
    return new ApiError(status, body)
  }
  if (!error.response) {
    return new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach Nirvaankar. Check your connection and try again.',
    })
  }
  return new ApiError(status, {
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again.',
  })
}

async function runSingleFlightRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState()
  if (!refreshToken) {
    clearSession()
    return null
  }

  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      { refreshToken },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
    )
    setTokens(data)
    return data.accessToken as string
  } catch {
    clearSession()
    return null
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = runSingleFlightRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const code = error.response?.data?.error?.code

    const shouldRefresh =
      !!config &&
      !config._retry &&
      status === 401 &&
      code !== 'INVALID_CREDENTIALS' &&
      code !== 'OTP_INVALID' &&
      !config.url?.includes('/api/v1/auth/refresh') &&
      !config.url?.includes('/api/v1/auth/login') &&
      !config.url?.includes('/api/v1/auth/register')

    if (shouldRefresh) {
      config._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`
        return apiClient.request(config)
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      }
    }

    throw parseApiError(error)
  },
)
