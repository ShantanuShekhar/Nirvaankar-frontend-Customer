# Frontend ↔ Backend Mapping — Nirvaankar

Source of truth: `d:\Learning\Projects\Backend2\nirvaankar-backend`  
Analyzed: Spring Boot modular monolith. Identity, catalog, cart, checkout, orders and simulated payments are implemented. SDUI/theme remain schema-only.

<!-- Base URL: `{VITE_API_URL}` → default `http://localhost:8080`   -->
Base URL: `{VITE_API_URL}` → default `http://3.109.158.178:8080` 
API prefix: `/api/v1`

---

## Global contracts

### Error response (all failures)

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "traceId": "abc123...",
    "fieldErrors": [{ "field": "email", "message": "must be a well-formed email address" }]
  }
}
```

- `fieldErrors` may be `null` / omitted when empty.
- Clients switch on `error.code`, never message text.
- Response header: `X-Trace-Id` (echoed).

### Cursor pagination

```json
{
  "items": [ ... ],
  "nextCursor": "opaque-string-or-null",
  "hasMore": true
}
```

No total count. Query params: `cursor` (optional), `limit` (default 20, max 100 where validated).

### Money

Backend stores / will return amounts as **minor units** (`BIGINT`): `149900` = ₹1499.00 with separate `currency` (`INR`).  
Frontend formats only via `shared/utils/money.ts`.

### Idempotency

Header: `Idempotency-Key: <UUID>`

Server stores a SHA-256 hex `request_hash` as **CHAR(64)** (`idempotency_keys`). No frontend change — only send the header and reuse the same key on retry.

**Required today** on:

| Method | Path |
|--------|------|
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/orders` |
| POST | `/api/v1/payments` |
| POST | `/api/v1/refunds` |

Webhooks and `POST /api/v1/payments/{id}/simulate-capture` do **not** require `Idempotency-Key`. Duplicate capture is a no-op in `Payment.capture`.

Same key must be reused on retry of the same logical operation. Different payload with same key → `IDEMPOTENCY_KEY_REUSED` (422).

### Auth headers

| Header | When |
|--------|------|
| `Authorization: Bearer <accessToken>` | Authenticated routes |
| `Idempotency-Key` | Register (+ future money-moving POSTs) |
| `Content-Type: application/json` | Bodies |
| `X-Trace-Id` | Optional; server generates if absent |

### Auth model (actual backend — important)

| Token | Backend behaviour | Frontend decision |
|-------|-------------------|-------------------|
| Access JWT (RS256, ~15m) | Returned in JSON as `tokens.accessToken` | **Memory only** (Zustand). Never localStorage/sessionStorage. |
| Refresh (opaque string, ~30d) | Returned in JSON as `tokens.refreshToken`; **must be sent in request body** on refresh/logout. Backend does **not** set httpOnly cookies. | Held in memory; **sessionStorage** only so tab reload can call `/auth/refresh`. Not access-token storage. Prefer migrating to httpOnly cookie when backend adds it. |

`withCredentials: true` is enabled for future cookie support / CORS.

### Public paths (SecurityConfig)

- `/api/v1/auth/**`
- `/api/v1/config/**` *(reserved; no controller yet)*
- `GET /api/v1/catalog/**` (public)
- Actuator health, swagger

### Panel prefixes

| Prefix | Gate |
|--------|------|
| `/api/v1/**` | Authenticated (except public) |
| `/api/v1/seller/**` | Role `seller` or `admin` |
| `/api/v1/admin/**` | Role `admin` or `support` + `@PreAuthorize` permissions |

---

## Implemented REST APIs

### 1. Auth — `AuthController` → `/api/v1/auth`

#### POST `/api/v1/auth/register`

| | |
|--|--|
| Auth | No |
| Headers | **`Idempotency-Key` required** |
| Frontend | Registration |

**Request**

```ts
{
  email?: string;           // valid email
  phone?: string;           // E.164: ^\+[1-9]\d{7,14}$
  password: string;         // 8–72
  firstName?: string;
  lastName?: string;
  device?: DevicePayload;   // optional on web
}
```

**Response** `201` — `SessionResponse`

```ts
{
  userId: string;           // UUID v7 public id
  email: string | null;
  phone: string | null;
  firstName: string | null;
  roles: string[];
  tokens: TokenResponse;
}
```

#### POST `/api/v1/auth/login`

| | |
|--|--|
| Auth | No |
| Frontend | Password login |

**Request**

```ts
{
  identifier: string;       // email or phone
  password: string;
  device?: DevicePayload;
}
```

**Response** `200` — `SessionResponse`

#### POST `/api/v1/auth/otp/request`

| | |
|--|--|
| Auth | No |
| Frontend | OTP login step 1 |

**Request** `{ phone: string }` (E.164)  
**Response** `200`

```ts
{
  destination: string;      // masked phone
  expiresInSeconds: number;
  devCode: string | null;   // only when server `expose-in-response: true`
}
```

#### POST `/api/v1/auth/otp/verify`

| | |
|--|--|
| Auth | No |
| Frontend | OTP login step 2 |

**Request**

```ts
{
  phone: string;
  code: string;             // 4–8 chars
  device?: DevicePayload;
}
```

**Response** `200` — `SessionResponse`

#### POST `/api/v1/auth/refresh`

| | |
|--|--|
| Auth | No (body carries refresh token) |
| Frontend | Bootstrap + 401 single-flight refresh |

**Request** `{ refreshToken: string }`  
**Response** `200` — `TokenResponse`

```ts
{
  accessToken: string;
  expiresInSeconds: number;
  expiresAt: string;              // ISO Instant
  refreshToken: string;           // rotated
  refreshTokenExpiresAt: string;
}
```

Reusing an already-rotated refresh token → `REFRESH_TOKEN_REUSED` and chain revoked.

#### POST `/api/v1/auth/logout`

| | |
|--|--|
| Auth | No (body) |
| Frontend | Logout current device |

**Request** `{ refreshToken: string }`  
**Response** `204`

#### POST `/api/v1/auth/logout-all`

| | |
|--|--|
| Auth | **Yes** (Bearer) |
| Frontend | Sign out all devices |

**Request** empty  
**Response** `204`

#### DevicePayload (optional on web)

```ts
{
  deviceUuid: string;       // max 100, required if device sent
  platform: "ios" | "android" | "web";
  appVersion?: string;
  osVersion?: string;
  model?: string;
  locale?: string;
  timezone?: string;
  pushToken?: string;
}
```

---

### 2. Profile — `MeController` → `/api/v1/me`

| Method | Path | Auth | Body / notes | Frontend |
|--------|------|------|--------------|----------|
| GET | `/api/v1/me` | Yes | — | Account home |
| PATCH | `/api/v1/me` | Yes | `UpdateProfileRequest` | Edit profile |
| PUT | `/api/v1/me/avatar` | Yes | `{ avatarUrl: string }` | Avatar update |
| GET | `/api/v1/me/devices` | Yes | — | Device list |
| DELETE | `/api/v1/me/devices/{deviceId}` | Yes | — | Revoke device |

**MeResponse**

```ts
{
  userId: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  locale: string | null;          // e.g. hi-IN
  dateOfBirth: string | null;     // LocalDate
  roles: string[];
  createdAt: string;
}
```

**UpdateProfileRequest**

```ts
{
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  locale?: string;                // ^[a-z]{2}-[A-Z]{2}$
}
```

---

### 3. Addresses — `AddressController` → `/api/v1/me/addresses`

| Method | Path | Auth | Frontend |
|--------|------|------|----------|
| GET | `/api/v1/me/addresses` | Yes | Address book / checkout |
| GET | `/api/v1/me/addresses/{addressId}` | Yes | Edit form |
| POST | `/api/v1/me/addresses` | Yes | Add address |
| PUT | `/api/v1/me/addresses/{addressId}` | Yes | Replace address |
| PUT | `/api/v1/me/addresses/{addressId}/default` | Yes | Set default |
| DELETE | `/api/v1/me/addresses/{addressId}` | Yes | Soft-delete |

**SaveAddressRequest**

```ts
{
  label?: "home" | "office" | "other";
  contactName: string;
  contactPhone: string;           // E.164
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;                // Indian 6-digit
  latitude?: number;
  longitude?: number;
  makeDefault: boolean;
}
```

**AddressResponse** — same fields + `id: number`, `countryCode`, `isDefault`.

---

### 4. Admin users — `AdminUserController` → `/api/v1/admin/users`

Customer storefront **does not** call these. Documented for completeness.

| Method | Path | Permission | Pagination |
|--------|------|------------|------------|
| GET | `/api/v1/admin/users?role&search&cursor&limit` | `user.read` | CursorPage\<UserSummary\> |
| POST | `.../{userId}/suspend` | `user.suspend` | body `{ reason }` |
| POST | `.../{userId}/reactivate` | `user.suspend` | — |
| POST | `.../{userId}/roles` | `role.assign` | `{ roleCode, scopeType?, scopeId? }` |
| DELETE | `.../{userId}/roles/{roleCode}` | `role.assign` | — |

`userId` path param = **public UUID**. List items expose `publicId` (not internal id).

---

## Not implemented as HTTP (schema ready only)

These modules have Flyway tables but **no customer REST yet**. Do not invent request/response contracts for them.

| Area | Schema tables (examples) | Notes |
|------|--------------------------|-------|
| Wishlist | `wishlists`, `wishlist_items` | No API |
| Seller | `sellers`, KYC, bank | `/api/v1/seller/**` not customer-facing |
| Reviews | `reviews`, `review_replies` | No API |
| Promotions | `promotions`, … | Discount stays 0 until this lands |
| SDUI / themes | `themes`, `theme_versions`, `screens`, `sections`, … | `/api/v1/config/**` |
| Feature flags | `feature_flags`, … | No API |
| Refunds | `refunds` | Path guarded; no controller yet |

### Live commerce APIs

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/catalog/categories` | public |
| GET | `/api/v1/catalog/products` | public (`category`, `q`, `cursor`, `limit`) |
| GET | `/api/v1/catalog/products/{uuidOrSlug}` | public |
| GET | `/api/v1/cart` | customer (`addressId` optional for GST split) |
| POST | `/api/v1/cart/items` | `{ sku, quantity }` |
| PATCH | `/api/v1/cart/items/{itemId}` | `{ quantity }` |
| DELETE | `/api/v1/cart/items/{itemId}` | |
| DELETE | `/api/v1/cart` | clear |
| GET | `/api/v1/checkout/preview?addressId=` | totals from backend |
| POST | `/api/v1/orders` | Idempotency-Key, `{ addressId }` |
| GET | `/api/v1/orders` | |
| GET | `/api/v1/orders/{orderId}` | public UUID |
| POST | `/api/v1/payments` | Idempotency-Key, `{ orderId }` — creates Razorpay order when gateway=razorpay |
| POST | `/api/v1/payments/{paymentId}/verify` | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` HMAC verified server-side |
| POST | `/api/v1/payments/{paymentId}/cancel` | unpaid checkout dismiss |
| POST | `/api/v1/payments/{paymentId}/simulate-capture` | simulated gateway only |
| POST | `/api/v1/payments/webhooks/simulated` | public, `{ paymentId, event }` |
| POST | `/api/v1/payments/webhooks/razorpay` | public, `X-Razorpay-Signature` |

### SDUI / design tokens (schema intent only)

`theme_versions.tokens` JSON is described as three-layer: primitive → semantic → component.  
Section `component_type` examples in SQL comments: `hero_carousel`, `product_grid`, `category_strip`, `banner`, `usp_row`, `maker_story`.  
**No published REST contract yet.** Frontend ships fallback tokens + local fallback home composition; ThemeProvider / ScreenRenderer are ready to consume a future config API without inventing field shapes beyond schema comments.

---

## Error codes the customer UI should handle

| Code | Typical HTTP | UX |
|------|--------------|----|
| VALIDATION_FAILED | 422 | Field errors |
| MALFORMED_REQUEST | 400 | Generic |
| INVALID_CREDENTIALS | 401 | Login form |
| TOKEN_EXPIRED / TOKEN_INVALID | 401 | Refresh then retry once |
| REFRESH_TOKEN_REUSED | 401 | Force re-login |
| ACCOUNT_INACTIVE | 403 | Suspended message |
| FORBIDDEN | 403 | No permission |
| OTP_INVALID | 401 | OTP form |
| OTP_ATTEMPTS_EXCEEDED | 403 | Request new OTP |
| RESOURCE_NOT_FOUND | 404 | Not found page |
| EMAIL_ALREADY_REGISTERED / PHONE_ALREADY_REGISTERED | 409 | Register form |
| RATE_LIMITED / OTP_RESEND_TOO_SOON | 429 | Wait messaging |
| IDEMPOTENCY_KEY_REUSED | 422 | Do not change key mid-retry |
| PRODUCT_UNAVAILABLE | 409 | Product cannot be sold |
| INSUFFICIENT_INVENTORY | 409 | Out of stock |
| CART_EMPTY | 409 | Checkout blocked |
| PRICE_CHANGED | 409 | Reload bag |
| INVALID_QUANTITY | 422 | Qty ≥ 1 |
| CHECKOUT_FAILED / PAYMENT_FAILED | 409 | Retry |
| INVALID_STATE_TRANSITION | 409 | e.g. already paid |
| INTERNAL_ERROR | 500 | Friendly retry |

---

## Frontend feature matrix

| Feature | Backend status | Frontend approach |
|---------|----------------|-------------------|
| Register / login / OTP / refresh / logout | ✅ Live | Full integration |
| Profile + devices | ✅ Live | Full integration |
| Address book | ✅ Live | Full integration + checkout shell |
| Admin users | ✅ Live | Out of customer app scope |
| Catalog / PLP / PDP | ✅ Live | Shop, category, search, PDP |
| Cart | ✅ Live | Server totals; protected route |
| Wishlist | ❌ Schema only | Empty state |
| Orders / payment | ✅ Live (simulated gateway) | Checkout + confirmation |
| SDUI home | ❌ Schema only | Fallback brand home + SDUI renderer stubs |
| Design tokens API | ❌ Schema only | Fallback token CSS variables |

---

## CORS

Allowed origin patterns: `http://localhost:*`, `https://*.nirvaankar.com`,`http://*.nirvaankar.com`  
Credentials allowed. Exposed headers: `X-Trace-Id`, `ETag`.
