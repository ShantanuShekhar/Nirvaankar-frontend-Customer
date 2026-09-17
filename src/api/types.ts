export type ApiFieldError = {
  field: string
  message: string
}

export type ApiErrorBody = {
  code: string
  message: string
  traceId?: string | null
  fieldErrors?: ApiFieldError[] | null
}

export type ApiErrorResponse = {
  error: ApiErrorBody
}

export type CursorPage<T> = {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export type DevicePayload = {
  deviceUuid: string
  platform: 'ios' | 'android' | 'web'
  appVersion?: string
  osVersion?: string
  model?: string
  locale?: string
  timezone?: string
  pushToken?: string
}

export type TokenResponse = {
  accessToken: string
  expiresInSeconds: number
  expiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}

export type SessionResponse = {
  userId: string
  email: string | null
  phone: string | null
  firstName: string | null
  roles: string[]
  tokens: TokenResponse
}

export type OtpChallengeResponse = {
  destination: string
  expiresInSeconds: number
  devCode: string | null
}

export type MeResponse = {
  userId: string
  email: string | null
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  locale: string | null
  dateOfBirth: string | null
  roles: string[]
  createdAt: string
}

export type DeviceResponse = {
  deviceId: number
  platform: string
  appVersion: string | null
  model: string | null
  lastSeenAt: string | null
  current: boolean
}

export type AddressResponse = {
  id: number
  label: string | null
  contactName: string
  contactPhone: string
  line1: string
  line2: string | null
  landmark: string | null
  city: string
  state: string
  pincode: string
  countryCode: string
  latitude: number | null
  longitude: number | null
  isDefault: boolean
}

export type SaveAddressRequest = {
  label?: 'home' | 'office' | 'other'
  contactName: string
  contactPhone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  makeDefault: boolean
}

export type UpdateProfileRequest = {
  firstName?: string
  lastName?: string
  gender?: string
  dateOfBirth?: string
  locale?: string
}

export type RegisterRequest = {
  email?: string
  phone?: string
  password: string
  firstName?: string
  lastName?: string
  device?: DevicePayload
}

export type PasswordLoginRequest = {
  identifier: string
  password: string
  device?: DevicePayload
}

export type OtpRequestPayload = {
  phone: string
}

export type OtpLoginRequest = {
  phone: string
  code: string
  device?: DevicePayload
}

export type RefreshRequest = {
  refreshToken: string
}

export type LogoutRequest = {
  refreshToken: string
}
