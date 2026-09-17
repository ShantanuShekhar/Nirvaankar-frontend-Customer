# Frontend Architecture — Nirvaankar

## Goals

- Adapt strictly to backend contracts (identity live; commerce schema-pending).
- Premium sustainable D2C feel — not a generic marketplace skin.
- Safe auth: access token in memory; single-flight refresh; idempotency for register / future money moves.
- Feature-based folders with clear layers: API → hooks/query → UI.

## Folder map

```text
src/
├── api/                 Axios client, types, endpoint modules
├── config/              Brand + fallback tokens + query defaults
├── features/
│   ├── auth/            Login / register / OTP
│   ├── home/            Brand home + fallback SDUI sections
│   ├── product/         Shop / category / PDP / search shells
│   ├── cart/            Cart / wishlist / checkout / orders shells
│   ├── profile/         Account, addresses, devices
│   └── sdui/            Registry, ScreenRenderer, blocks
├── layouts/             Shop chrome (header / footer)
├── providers/           Query, theme, auth bootstrap
├── routes/              Router + protected gate
├── shared/              UI primitives, hooks, utils
├── store/               Zustand (auth memory, UI chrome)
└── styles/              Tailwind v4 + base tokens
```

## State

| Concern | Tool |
|---------|------|
| Server data (me, addresses, …) | TanStack Query |
| Access / refresh / user session | Zustand (`authStore`) |
| Mobile nav | Zustand (`uiStore`) |

## API client

`api/client.ts`:

- `withCredentials: true`
- Request interceptor: Bearer from Zustand
- Response interceptor: 401 → single-flight refresh → retry once → else clear session + redirect login
- Errors normalized to `ApiError` matching `{ error: { code, message, traceId, fieldErrors } }`

## Money

All display formatting goes through `shared/utils/money.ts` (`formatMoney(amountMinor, currency)`).

## Pagination

Backend uses cursor pages `{ items, nextCursor, hasMore }`. When list APIs exist, use `useInfiniteQuery` with `nextCursor` — never page numbers.

## Idempotency

`useIdempotencyKey` + register header. Reuse key on retry; reset after success. Same pattern for future `POST /orders` and payments.

## SDUI safety

1. Unknown `componentType` → skip
2. Block `ErrorBoundary` → isolate failure
3. `React.lazy` + `Suspense`
4. Schema version gate via `SUPPORTED_SDUI_SCHEMA_VERSION`
5. Fallback home sections when config API absent

## Capability flags

`api/endpoints/capabilities.ts` mirrors backend readiness so UI does not call non-existent controllers.
