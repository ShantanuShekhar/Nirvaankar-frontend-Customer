import type {
  AddressResponse,
  LogoutRequest,
  MeResponse,
  OtpChallengeResponse,
  OtpLoginRequest,
  OtpRequestPayload,
  PasswordLoginRequest,
  RefreshRequest,
  RegisterRequest,
  SaveAddressRequest,
  SessionResponse,
  TokenResponse,
  UpdateProfileRequest,
  DeviceResponse,
} from '@/api/types'
import { apiClient } from '@/api/client'

export const authApi = {
  register(body: RegisterRequest, idempotencyKey: string) {
    return apiClient.post<SessionResponse>('/api/v1/auth/register', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
  },
  login(body: PasswordLoginRequest) {
    return apiClient.post<SessionResponse>('/api/v1/auth/login', body)
  },
  requestOtp(body: OtpRequestPayload) {
    return apiClient.post<OtpChallengeResponse>('/api/v1/auth/otp/request', body)
  },
  verifyOtp(body: OtpLoginRequest) {
    return apiClient.post<SessionResponse>('/api/v1/auth/otp/verify', body)
  },
  refresh(body: RefreshRequest) {
    return apiClient.post<TokenResponse>('/api/v1/auth/refresh', body)
  },
  logout(body: LogoutRequest) {
    return apiClient.post<void>('/api/v1/auth/logout', body)
  },
  logoutAll() {
    return apiClient.post<void>('/api/v1/auth/logout-all')
  },
}

export const profileApi = {
  getMe() {
    return apiClient.get<MeResponse>('/api/v1/me')
  },
  updateMe(body: UpdateProfileRequest) {
    return apiClient.patch<MeResponse>('/api/v1/me', body)
  },
  changeAvatar(avatarUrl: string) {
    return apiClient.put<void>('/api/v1/me/avatar', { avatarUrl })
  },
  listDevices() {
    return apiClient.get<DeviceResponse[]>('/api/v1/me/devices')
  },
  deactivateDevice(deviceId: number) {
    return apiClient.delete<void>(`/api/v1/me/devices/${deviceId}`)
  },
}

export const addressApi = {
  list() {
    return apiClient.get<AddressResponse[]>('/api/v1/me/addresses')
  },
  get(addressId: number) {
    return apiClient.get<AddressResponse>(`/api/v1/me/addresses/${addressId}`)
  },
  create(body: SaveAddressRequest) {
    return apiClient.post<AddressResponse>('/api/v1/me/addresses', body)
  },
  update(addressId: number, body: SaveAddressRequest) {
    return apiClient.put<AddressResponse>(`/api/v1/me/addresses/${addressId}`, body)
  },
  setDefault(addressId: number) {
    return apiClient.put<void>(`/api/v1/me/addresses/${addressId}/default`)
  },
  remove(addressId: number) {
    return apiClient.delete<void>(`/api/v1/me/addresses/${addressId}`)
  },
}
