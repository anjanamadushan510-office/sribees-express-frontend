# SRIBEES Express — Frontend

Next.js 16 (App Router) frontend for the SRIBEES Express courier platform, talking
to the existing Laravel (Passport / multi-guard) backend.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives, `asChild` API)
- **Axios** + **TanStack React Query** (data fetching/state)
- **React Hook Form** + **Zod** (forms/validation)
- **Lucide** icons · **Recharts** (analytics)

## Getting started

```bash
npm install
# set NEXT_PUBLIC_API_BASE_URL in .env.local (defaults to http://localhost:8000/api)
npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` must point at the Laravel API root (module routes are
served under `/api`), e.g. `http://localhost:8000/api`.

## Backend contract (verified against the Laravel source)

- **Auth:** Laravel Passport (OAuth2 **Bearer** tokens), multiple guards
  (`staff`, `client`, ...). Login endpoints:
  - `POST /api/v1/login/staff`
  - `POST /api/v1/login/client`
  These return a **raw** body `{ user, token, secret, permissions:[{authority}] }`
  (NOT the standard envelope). `secret` is a JWT carrying `{ guard, role[], permissions }`,
  decoded client-side for UI gating (see `lib/auth/session.ts`).
- **Standard envelope** (every other endpoint, via `APIHelper::makeAPIResponse`):
  `{ status_code, timestamp, message, data, error, pagination, metadata }`.
  Pagination: `{ total, per_page, current_page, last_page }`. See `types/api.ts`.
- **Public tracking:** `POST /api/tracking` with `{ waybill_id }` → `OrderAPIResource`
  (note the literal `"completed date"` key). No auth. See `lib/api/tracking.ts`.

## Architecture

| Audience | URL space | Backend guard |
| --- | --- | --- |
| Public | `/`, `/track` | none |
| Customer portal | `/dashboard`, `/shipments`, `/pricing`, `/pickups`, `/profile` | `auth:client` |
| Staff/Admin portal | `/admin/dashboard`, `/admin/packages`, ... | `auth:staff` |

- Route protection lives in **`proxy.ts`** (Next.js 16 renamed `middleware` → `proxy`).
  It reads the `sx_token` / `sx_guard` cookies mirrored at login and redirects
  unauthenticated users. `components/layout/auth-guard.tsx` adds a client-side guard.
- API client: `lib/api/client.ts` (Bearer injection, 401 handling, `unwrap()` helper).
- Auth state: `providers/auth-provider.tsx` (`useAuth()` → session, login, logout,
  `hasPermission`, `hasRole`).

## Layout / folder map

```
app/
  (public)/        landing + tracking          -> /, /track
  (auth)/          customer login              -> /login
  (customer)/      customer portal (shell)     -> /dashboard, /shipments, ...
  admin/
    login/         staff login                 -> /admin/login
    (portal)/      staff portal (shell)        -> /admin/dashboard, ...
components/  ui (shadcn) | layout | shared | forms | public
lib/         api/ | auth/ | config | format | nav | utils
providers/   query-provider | auth-provider
types/       api | auth | tracking
proxy.ts     route protection
```

## Status

Foundation + scaffolding complete and building green. Portal pages currently use
`ComingSoon` placeholders where backend payloads still need to be wired; the public
tracking flow and both auth flows are fully functional.
