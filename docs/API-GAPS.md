# API gaps: what this frontend needs that the backend does not have

This app was written against a Laravel API and now talks to the FastAPI service
at `sribees-express-backend`. Of the ~205 distinct paths it used to call, **one**
existed on the new backend. This file is the honest ledger of what that cost.

The rule applied throughout: **never fake it.** A screen either talks to a real
endpoint or says it cannot. Empty arrays are not returned in place of missing
data — "you have no invoices" is a false statement about someone's account,
where an error is a true one.

Two mechanisms enforce that:

- `lib/api/unavailable.ts` — `unavailable("Feature")` throws
  `FeatureUnavailableError`, surfaced by the existing react-query error states.
- A request-interceptor guard in `lib/api/client.ts` rejects any path starting
  `/v1/` or `/admin/` before it leaves the browser. Those are Laravel-era URLs;
  the base URL already ends in `/api/v1`, so they could only ever 404. This is
  what keeps the ~24 unported admin modules honest without touching each file.

---

## Working end to end

| Area | Endpoints |
|---|---|
| Client + staff login, refresh, logout | `/identity/auth/{client,staff}/*` |
| Customer dashboard | `/client-portal/dashboard/summary` |
| Customer shipments: list, detail, history, create | `/client-portal/orders*` |
| Customer pickup requests: list, create | `/client-portal/pickup-requests` |
| City and status dropdowns | `/client-portal/{cities,order-statuses}` |
| Public parcel tracking | `/public/track/{waybill_id}` |

Three of those did not exist before this migration and were added to the
backend as part of it: the two client-portal catalogues (a customer literally
could not create an order without a city list) and public tracking.

## Deliberately removed from the UI

Each of these was a control that could not do what it appeared to offer. The
alternative was leaving a button that always errored.

| Removed | Why | To restore |
|---|---|---|
| Waybill / recipient search on the shipments list | The list endpoint filters by `status_key` only | Search parameters on `GET /client-portal/orders` |
| Monthly orders area chart | No time-series endpoint; the summary is current counts only | An orders-over-time endpoint |
| Cancel pickup request | No cancel route exists | `POST /client-portal/pickup-requests/{id}/cancel` |
| Webhook settings dialog | Webhooks live under `/ecommerce`, which authenticates by API key, not a portal login | Portal-authenticated webhook management, or documented API-key issuance |
| Vehicle type + order count on the pickup form | Not fields the request accepts | Add them to `ClientPickupRequestCreate` |
| Manual waybill entry, order reference, second phone, description, note on the new-shipment form | Not fields `ClientOrderCreate` accepts | Extend that schema |
| Recipient name / phone / address on public tracking | **Deliberate, not a gap.** Public + guessable waybill = do not publish PII | Nothing. Keep it out |
| Password-expiry warning at login | No expiry claim in the token | A claim, if the policy is ever real |
| Client-side permission checks | The API exposes roles, not permissions. `hasPermission()` returns true and lets the API's 403 decide | A permissions claim on `/me` |

## Admin area: ported and not

**Ported and working against the API** (verified end to end — see
`scripts/e2e-admin-portal.mjs`):

| Screen | Endpoints |
|---|---|
| Operations dashboard | `/analytics/dashboard/status-counts` |
| Packages list + detail | `/shipments/orders*`, incl. status transitions |
| Assign rider (order and pickup) | `/fleet/orders/{id}/assign-rider`, `/shipments/pickup-requests/{id}/assign-rider` |
| Pickup operations | `/shipments/pickup-requests*` |
| Drivers | `/fleet/riders*` (read-only) |
| Notification settings | `/notifications/settings*` |

API modules also exist for `/geo` (zones, cities, branches, post offices),
`/warehouse` (bags, sorting buckets) and `/finance` (branch and rider deposits,
approve/reject) — `lib/api/admin-geo.ts`, `admin-warehouse.ts`,
`admin-finance.ts`. Their screens are not rewired yet, so those pages still
fail loudly via the interceptor guard.

**Removed from ported screens, because the endpoint does not exist:**

| Removed | Why |
|---|---|
| Create order as staff | `POST /shipments/orders` needs a `client_id` and nothing lists clients, so the form could not be filled in honestly. `/admin/packages/new` explains this instead of 404ing |
| Create / edit a driver | A rider is a Staff row; there is no staff CRUD endpoint |
| Order remarks, reversal history | No such data on this API. Per-transition `reason` is in the status timeline |
| KPI panel, regional overview | No KPI snapshot and no multi-branch rollup endpoint |
| Cancel / fail / receive pickup buttons | Replaced by one status control — the API takes a target status and validates it, so three buttons were three chances to disagree with the server |

**Known rough edges in what is ported:**

- The order status control reads the catalogue from `/client-portal/order-statuses`,
  which is client-authenticated, so it 403s for staff. The dialog says so
  rather than offering invented statuses. A staff-readable catalogue endpoint
  would fix it.
- Pickup target statuses are a local list for the same reason. The backend
  still validates them, so the worst case is an option that errors.
- Driver search filters in the browser because `/fleet/riders` is unpaged and
  has no search. Fine at this size, not at a few hundred riders.
- `/shipments/pickup-requests` has no limit/offset, so that list is unpaged.
- The staff order list filters by client **ID**, not name — there is no client
  lookup to resolve a name into one.

**No backend at all** — these screens still fail loudly and need a
keep-or-drop decision before anyone writes endpoints: clients, client users,
profile requests, announcements, manifests, mile operations, HO operations,
order clearing, roles and permissions, reason types, staff, waybill inventory,
bespoke reports, barcode/label printing, tax types, expense types.

## Also missing for the customer area

- **Profile** (`/profile`) — no endpoint to read or update a client user beyond
  `/identity/auth/client/me`.
- **Pricing** (`/pricing`) — rate cards are exposed to API-key merchants at
  `/ecommerce/rates`, not to portal users.
- **Finances** (`/finances`) — client invoices exist under `/finance/clients/
  {id}/invoices` but are staff-authenticated.
- **Waybill requests** (`/waybill-requests`) — no counterpart.
- **Barcode printing** (`/print/barcode/[id]`) — no label endpoint.

These pages still exist and still route; they surface the unavailable error
rather than rendering fabricated content.

## Operational note

`/public/track/{waybill_id}` is unauthenticated and has no rate limiting in
front of it, so waybill enumeration is possible. It exposes no personal data by
design, but it does expose parcel volume. Tracked in the backend's
`docs/DEPLOYMENT.md` §7 alongside the other edge gaps.
