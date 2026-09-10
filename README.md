# SRIBEES Express — Frontend

Next.js 16 (App Router) customer portal and staff/admin portal for the SRIBEES
Express courier platform, talking to the **FastAPI backend**
(`sribees-express-backend`).

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives, `asChild` API)
- **Axios** + **TanStack React Query** (data fetching/state)
- **React Hook Form** + **Zod** (forms/validation)
- **Lucide** icons · **Recharts** (analytics)

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit if you want a local backend
npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` must point at the API root **including `/api/v1`**.
It defaults to the deployed development API
(`https://devapiexpress.sribees.com/api/v1`), so a fresh clone runs against a
real backend with no setup. For a local backend use
`http://localhost:8000/api/v1`.

> HTTPS is not cosmetic for the mobile client that shares this API: Android
> blocks cleartext from API 28, so an `http://` origin fails at the socket.

## Backend contract

- **Auth: JWT access + refresh.** `POST /identity/auth/{staff|client}/login`
  returns a token pair only, so the profile is a second call to
  `GET /identity/auth/{guard}/me`. Nothing is persisted until both succeed — a
  token that cannot be resolved to a user would render the app as "logged in"
  with an empty profile.
  - **Refresh tokens rotate and the old one dies immediately.** That is why
    `lib/api/client.ts` shares a single in-flight refresh promise across
    concurrent 401s; firing two refreshes races one of them into a 401.
  - Guards are `staff` and `client`. The API exposes **roles, not permissions** —
    `hasPermission()` returns true and lets the API's 403 decide.
- **There is no response envelope.** FastAPI returns the resource itself: an
  object for a single resource, a bare array for a list. `unwrap()` and
  `pickKey()` in `lib/api/client.ts` are deprecated leftovers from the previous
  backend; do not use them in new code.
- **Public tracking:** `GET /public/track/{waybill_id}`, unauthenticated, and
  deliberately narrow — no recipient name, phone, address or COD amount. A
  waybill is printed on the outside of the parcel, so publishing PII behind one
  is publishing it to whoever handles the parcel. Signed-in clients see their own
  orders in full via `/client-portal/orders`.
- **Endpoint coverage is partial and tracked.** [`docs/API-GAPS.md`](docs/API-GAPS.md)
  is the authoritative ledger of what exists, what was removed from the UI
  because it could not be honoured, and what still has no backend at all. Read it
  before assuming an endpoint exists.

## Architecture

| Audience | URL space | Auth |
| --- | --- | --- |
| Public | `/`, `/track` | none |
| Customer portal | `/dashboard`, `/shipments`, `/pickups`, ... | `client` |
| Staff/Admin portal | `/admin/dashboard`, `/admin/packages`, ... | `staff` |

- Route protection lives in **`proxy.ts`** (Next.js 16 renamed `middleware` →
  `proxy`). It reads the `sx_token` / `sx_guard` cookies mirrored at login and
  redirects unauthenticated users. `components/layout/auth-guard.tsx` adds a
  client-side guard.
- API client: `lib/api/client.ts` — bearer injection, shared-promise refresh on
  401, and a request-interceptor guard that rejects any path starting `/v1/` or
  `/admin/`. Those are legacy URLs from the previous backend; the base URL
  already ends in `/api/v1`, so they could only ever 404.
- Missing endpoints: `lib/api/unavailable.ts` throws `FeatureUnavailableError`,
  surfaced through the existing react-query error states. **Never** return empty
  data in place of a missing endpoint — "you have no invoices" is a false
  statement about someone's account, where an error is a true one.
- Auth state: `providers/auth-provider.tsx` (`useAuth()` → session, login,
  logout, `hasRole`).

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
docs/        API-GAPS.md  <- what the backend can and cannot serve
scripts/     e2e-customer-portal.mjs | e2e-admin-portal.mjs
proxy.ts     route protection
```

## Verifying a change

Typecheck and lint are necessary and **not sufficient** — they passed on code
with an infinite render loop, invented status keys, and a login form that
GET-ed credentials into the URL. The real gate is the end-to-end scripts, which
log in through the real form against a live API and exit non-zero on any failed
check or console error:

```bash
npm run build && npm run start &   # e2e runs against a production build
BASE_URL=http://localhost:3000 \
  CLIENT_EMAIL=... CLIENT_PASSWORD=... node scripts/e2e-customer-portal.mjs
BASE_URL=http://localhost:3000 \
  STAFF_EMAIL=... STAFF_PASSWORD=... node scripts/e2e-admin-portal.mjs
```

`next dev` (Turbopack) never reaches Playwright's `networkidle`, so tests must
wait on elements rather than network quiet.

## Status

Customer portal and the ported half of the admin area work end to end against
the deployed API. The rest of the admin area fails loudly rather than rendering
fabricated data, and needs a keep-or-drop decision before endpoints are written
for it — see `docs/API-GAPS.md`.
